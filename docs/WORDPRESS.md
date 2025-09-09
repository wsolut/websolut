# WordPress Plugin: Static Page Publisher

The **Static Page Publisher** plugin allows you to deploy static pages to your WordPress site automatically via REST API.
It integrates seamlessly with Websolut for automated publishing workflows.

---

## Features

- Generate a secure access token for API requests
- Upload and deploy a base64-encoded ZIP containing your landing page
- Automatically replace the WordPress front page with uploaded content
- Share and view your API base URL for integration
- Works great with **CI/CD pipelines**, **design systems**, and **Websolut exports**

---

## REST API Endpoints

- `GET /wp-json/static-page-publisher/v1/verify-token`
  Verify if a token is valid

- `POST /wp-json/static-page-publisher/v1/update-landing`
  Upload and deploy a base64-encoded ZIP as the new landing page

---

## Installation

1. Upload the plugin folder to `/wp-content/plugins/` or install via **Plugins > Add New**.
2. Activate the plugin through the **Plugins** menu in WordPress.
3. Go to **Static Page Publisher** in the WordPress admin menu.
4. Generate an access token and use it in your API requests:
   - Header: `X-API-Token: yourtoken` or `Authorization: Bearer yourtoken`
   - Query param: `?token=yourtoken`

---

## How to Use with Websolut

1. In your project, click **Export/Deploy**.
2. Select **Deploy to WordPress**.
3. Copy the **Base URL** and **Token** from the WordPress plugin (**Static Page Publisher**) admin page.
4. Paste the values into Websolut and deploy.

---

## Frequently Asked Questions

### How do I deploy a landing page?
Send a `POST` request with a JSON body containing a base64 ZIP (`zip_base64`) to:

```
/wp-json/static-page-publisher/v1/update-landing
```

Include your access token in the request headers or query parameters.

---

### Will this override my existing front page?
Yes. The plugin automatically serves the uploaded landing page on your site’s **front page**.
Your original theme files are not modified.

---

### Is my token secure?
Tokens are stored in the WordPress database and should be treated like API keys.
Rotate tokens periodically for best security practices.
