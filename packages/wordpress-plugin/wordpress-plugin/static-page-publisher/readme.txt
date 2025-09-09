=== Static Page Publisher ===
Contributors: Websolut Org
Tags: landing pages, rest api, deployment, automation
Requires at least: 6.0
Tested up to: 6.8
Requires PHP: 7.4
Stable tag: 1.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Deploy static landing pages via REST API and dynamically serve them on your front page.

== Description ==

Static Page Publisher allows you to deploy static landing pages to your WordPress site automatically via REST API.

**Features:**
* Generate a secure access token for API requests.
* Upload and deploy a base64-encoded ZIP containing your landing page.
* Front page is dynamically replaced with uploaded content.
* Easily view and share your API base URL for integration.

**REST API Endpoints:**
* `GET /wp-json/static-page-publisher/v1/verify-token` — Verify if a token is valid.
* `POST /wp-json/static-page-publisher/v1/update-landing` — Upload and deploy a base64-encoded ZIP as the new landing page.

Ideal for teams automating content deployment from Figma, design systems, or CI/CD pipelines.

== Installation ==

1. Upload the plugin folder to `/wp-content/plugins/` or install via **Plugins > Add New**.
2. Activate the plugin through the **Plugins** menu in WordPress.
3. Go to **Static Page Publisher** in the admin menu.
4. Generate an access token and use it in your API requests as:
   * Header: `X-API-Token: yourtoken` or `Authorization: Bearer yourtoken`
   * Query param: `?token=yourtoken`

== Frequently Asked Questions ==

= How do I deploy a landing page? =
Send a POST request with a JSON body containing a base64 ZIP (`zip_base64`) to `/wp-json/static-page-publisher/v1/update-landing` using your access token.

= Will this override my existing front page? =
Yes, the plugin automatically serves the uploaded landing page on your site’s front page. The original theme files are not modified.

= Is my token secure? =
Tokens are stored in the WordPress database and should be treated like API keys. Rotate tokens periodically.

== Screenshots ==

1. Admin page to generate and display your access token and API URL.

== Changelog ==

= 1.1.0 =
* Always serve uploaded landing page on front page.
* Removed toggle option for front-page override.
* Improved file type validation for uploaded ZIPs.

== Upgrade Notice ==

= 1.1.0 =
Front-page override is now always enabled. Tokens and ZIP upload endpoints remain unchanged.
