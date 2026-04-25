# ⚙ CF-Workers-SUB (Self-Hosted Subscription Aggregator)

![AnyTLS Subscription Aggregation Screenshot](./anytls.png)

This project merges multiple node links and subscription links into one unified subscription endpoint. It supports auto format conversion and custom routing rules.

> [!CAUTION]
> When aggregated sources are not base64, the worker can generate a **temporary 24-hour subscription** and send it to the converter backend, reducing direct exposure of your original endpoint.

> [!WARNING]
> Large non-base64 source sets may increase conversion time and can cause subscription update timeouts in some clients.

## 🛠 Features
1. **AnyTLS protocol support** (`anytls://`)
2. Auto-convert node links into base64 subscription format
3. Merge multiple base64 subscriptions into one endpoint
4. Convert output for different clients (via [Subscription Converter](https://sub.cmliussss.com/))
5. Support custom proxy/routing rules

## 🔧 AnyTLS Patch Details
This project includes the following AnyTLS-specific patches:

1. **Clash field normalization**
   - Convert `fingerprint` to `client-fingerprint` automatically.
2. **Auto-fill required AnyTLS fields**
   - Ensure `udp: true`, `alpn: [h2, http/1.1]`, and `skip-cert-verify` exist.
3. **Support both Clash node syntaxes**
   - Handles both block-style and inline map-style proxies.
4. **AnyTLS fallback on converter failure**
   - If `clash` conversion fails, the worker builds a valid Clash YAML directly from `anytls://` links.
5. **Related Clash hardening fixes**
   - Force `url-test` probe URL to `https://www.gstatic.com/generate_204`.
   - Inject a baseline `dns` block when missing.

## This project is forked from cmliu/CF-Workers-SUB

## 📦 Deploy on Cloudflare Pages
1. Fork this repository on GitHub.
2. In Cloudflare Pages, choose `Connect to Git` and deploy this project.
3. Bind a custom domain (recommended subdomain, e.g. `sub.example.com`).
4. Add environment variable `TOKEN` (default: `auto`), then your endpoint is:
   - `https://your-domain/auto`
5. Bind a KV namespace named `KV`.
6. Open your endpoint and paste node/subscription links (one per line).

## 🛠 Deploy on Cloudflare Workers
1. Create a new Worker in Cloudflare Workers.
2. Paste [`_worker.js`](./_worker.js) into the editor and deploy.
3. Set your subscription token (`mytoken` in code or env var `TOKEN`).
4. Bind a KV namespace named `KV`.
5. Open your endpoint and paste links (one per line).

## 📋 Environment Variables
| Name | Example | Required | Notes |
|-|-|-|-|
| TOKEN | `auto` | ✅ | Main subscription path, e.g. `/auto` |
| GUEST | `test` | ❌ | Guest token, e.g. `/sub?token=test` |
| LINK | `anytls://...` / `vless://...` / `vmess://...` / `https://...` | ❌ | Multi-line links (usually replaced by `KV`) |
| TGTOKEN | `6894...` | ❌ | Telegram bot token |
| TGID | `6946...` | ❌ | Telegram user/group ID for notifications |
| SUBNAME | `CF-Workers-SUB` | ❌ | Subscription name |
| SUBAPI | `SUBAPI.cmliussss.net` | ❌ | Converter backend |
| SUBCONFIG | `https://raw.githubusercontent.com/...ini` | ❌ | Converter config file |

## ⚠️ Notes
To enable Telegram notifications, create a Telegram bot for `TGTOKEN` and obtain target `TGID`.

## 🙏 Credits
Original author: [cmliu](https://github.com/cmliu)

[Alice Networks LTD](https://alicenetworks.net/), [mianayang](https://github.com/mianayang/myself/blob/main/cf-workers/sub/sub.js), [ACL4SSR](https://github.com/ACL4SSR/ACL4SSR/tree/master/Clash/config), [FeiYang](https://sub.v1.mk/)
