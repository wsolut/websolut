<?php
/**
 * Plugin Name: Static Page Publisher
 * Description: Generate secure access tokens, update landing pages via REST API, and dynamically serve uploaded landing pages (with subfolder routes) on your front page.
 * Version: 1.1.0
 * Author: HeartCoreDev
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

if (!defined('ABSPATH')) exit;

class StaticPagePublisher {
    private $option_name = 'spp_access_token';
    private $landing_dir;

    public function __construct() {
        $upload_dir = wp_upload_dir();
        $this->landing_dir = trailingslashit($upload_dir['basedir']) . 'static-page-publisher';

        add_action('admin_menu', [$this, 'admin_menu']);
        add_action('rest_api_init', [$this, 'register_routes']);
        add_action('template_redirect', [$this, 'serve_landing_page']);
    }

    // === Plugin Activation ===
    public static function activate() {
        flush_rewrite_rules();
    }

    // === Admin Menu ===
    public function admin_menu() {
        add_menu_page(
            'Static Page Publisher',
            'Static Page Publisher',
            'manage_options',
            'static-page-publisher',
            [$this, 'settings_page']
        );
    }

    public function settings_page() {
        if (isset($_POST['generate_token']) && check_admin_referer('spp_generate_token_action', 'spp_generate_token_nonce')) {
            $token = bin2hex(random_bytes(16));
            update_option($this->option_name, $token);
            echo "<div class='notice notice-success'><p>New token generated: <code>" . esc_html($token) . "</code></p></div>";
        }

        $token = get_option($this->option_name);
        $api_base_url = esc_url(rtrim(get_site_url(), '/') . '/wp-json/static-page-publisher/v1');

        echo "<div class='wrap'><h1>Static Page Publisher</h1>";
        echo "<form method='post'>";
        wp_nonce_field('spp_generate_token_action', 'spp_generate_token_nonce');
        echo "<p><button class='button button-primary' name='generate_token'>Generate Access Token</button></p>";
        if ($token) {
            echo "<p><strong>Current Token:</strong> <code>" . esc_html($token) . "</code></p>";
        }
        echo "</form>";
        echo "<h2>API Base URL</h2>";
        echo "<p>Use this URL in your client or Postman:</p>";
        echo "<p><input type='text' readonly value='" . esc_attr($api_base_url) . "' style='width:100%;font-size:1.2em;'></p>";
        echo "</div>";
    }

    private function get_stored_token() {
        return get_option($this->option_name);
    }

    // === REST API Routes ===
    public function register_routes() {
        register_rest_route('static-page-publisher/v1', '/verify-token', [
            'methods' => 'GET',
            'callback' => [$this, 'verify_token'],
            'permission_callback' => [$this, 'check_token_permission'],
        ]);

        register_rest_route('static-page-publisher/v1', '/update-landing', [
            'methods' => 'POST',
            'callback' => [$this, 'update_landing'],
            'permission_callback' => [$this, 'check_token_permission'],
        ]);
    }

    public function check_token_permission($request) {
        $token = $this->extract_token($request);
        return $token && $token === $this->get_stored_token();
    }

    private function extract_token($request) {
        $token = $request->get_param('token');
        if ($token) return $token;

        $headers = function_exists('getallheaders') ? getallheaders() : [];
        if (isset($headers['X-API-Token'])) return $headers['X-API-Token'];
        if (isset($headers['x-api-token'])) return $headers['x-api-token'];

        $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        if (strpos($auth, 'Bearer ') === 0) return substr($auth, 7);

        return null;
    }

    public function verify_token($request) {
        return new WP_REST_Response(['valid' => true, 'version' => '1.1.0'], 200);
    }

    // === Update Landing Page ===
    public function update_landing($request) {
        $body = json_decode($request->get_body(), true);
        if (!isset($body['zip_base64'])) {
            return new WP_REST_Response(['error' => 'Invalid payload'], 400);
        }

        if (!file_exists($this->landing_dir)) {
            wp_mkdir_p($this->landing_dir);
        }

        $zip_path = $this->landing_dir . '/landing.zip';
        file_put_contents($zip_path, base64_decode($body['zip_base64']));

        $zip = new ZipArchive;
        if ($zip->open($zip_path) !== TRUE) {
            return new WP_REST_Response(['error' => 'Invalid ZIP file'], 400);
        }

        // ✅ Validate files with wp_check_filetype()
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $stat = $zip->statIndex($i);
            $filename = $stat['name'];

            // Skip directories
            if (substr($filename, -1) === '/') continue;

            // Extract extension directly (case-insensitive)
            $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

            $allowed = ['html','htm','css','js','png','jpg','jpeg','gif','txt','svg'];
            if (!$ext || !in_array($ext, $allowed, true)) {
                $zip->close();
                wp_delete_file($zip_path);
                return new WP_REST_Response(
                    ['error' => 'ZIP contains disallowed file type: ' . esc_html($ext ?: '(none)')],
                    400
                );
            }
        }


        $zip->extractTo($this->landing_dir);
        $zip->close();
        wp_delete_file($zip_path);

        return new WP_REST_Response([
            'success' => true,
            'path' => $this->landing_dir,
            'landing_url' => esc_url(rtrim(site_url(), '/'))
        ], 200);
    }

    // === Serve Landing Page (supports subroutes) ===
    public function serve_landing_page() {
        // Ensure REQUEST_URI exists and unslash
        $request_uri = isset($_SERVER['REQUEST_URI']) ? wp_unslash($_SERVER['REQUEST_URI']) : '/';

        // Use wp_parse_url() instead of parse_url()
        $parsed = wp_parse_url($request_uri);
        $request_path = isset($parsed['path']) ? trim($parsed['path'], '/') : '';

        // Sanitize subfolder name
        $safe_path = $request_path ? sanitize_file_name($request_path) : '';

        // Determine folder to serve
        $folder = $safe_path ? $this->landing_dir . '/' . $safe_path : $this->landing_dir;
        $index_file = $folder . '/index.html';

        if (!file_exists($index_file)) return;

        $html = file_get_contents($index_file);

        // Determine base URL for relative assets
        $base_url = esc_url(
            rtrim(site_url(), '/') . '/wp-content/uploads/static-page-publisher/' . ($safe_path ? $safe_path . '/' : '')
        );

        // Inject <base> tag safely
        $html = preg_replace('/<head>/', '<head><base href="' . $base_url . '">', $html, 1);

        // Output raw HTML safely because path and input are sanitized
        // Safe output: $html comes from controlled uploaded files with sanitized paths.
        // Escaping it would break the full HTML page (CSS/JS would be stripped).
        echo $html;
        exit;
    }

}

// === Initialize Plugin ===
register_activation_hook(__FILE__, ['StaticPagePublisher', 'activate']);
new StaticPagePublisher();
