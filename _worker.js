
// 部署完成后在网址后面加上这个，获取自建节点和机场聚合节点，/?token=auto或/auto或

let mytoken = 'auto';
let guestToken = ''; //可以随便取，或者uuid生成，https://1024tools.com/uuid
let BotToken = ''; //可以为空，或者@BotFather中输入/start，/newbot，并关注机器人
let ChatID = ''; //可以为空，或者@userinfobot中获取，/start
let TG = 0; //小白勿动， 开发者专用，1 为推送所有的访问信息，0 为不推送订阅转换后端的访问信息与异常访问
let FileName = 'CF-Workers-SUB';
let SUBUpdateTime = 6; //自定义订阅更新时间，单位小时
let total = 99;//TB
let timestamp = 4102329600000;//2099-12-31

//节点链接 + 订阅链接
let MainData = `
https://cfxr.eu.org/getSub
`;

let urls = [];
let subConverter = "SUBAPI.cmliussss.net"; //在线订阅转换后端，目前使用CM的订阅转换功能。支持自建psub 可自行搭建https://github.com/bulianglin/psub
let subConfig = "https://raw.githubusercontent.com/cmliu/ACL4SSR/main/Clash/config/ACL4SSR_Online_MultiCountry.ini"; //订阅配置文件
let subProtocol = 'https';

export default {
	async fetch(request, env) {
		const userAgentHeader = request.headers.get('User-Agent');
		const userAgent = userAgentHeader ? userAgentHeader.toLowerCase() : "null";
		const url = new URL(request.url);
		const token = url.searchParams.get('token');
		mytoken = env.TOKEN || mytoken;
		BotToken = env.TGTOKEN || BotToken;
		ChatID = env.TGID || ChatID;
		TG = env.TG || TG;
		subConverter = env.SUBAPI || subConverter;
		if (subConverter.includes("http://")) {
			subConverter = subConverter.split("//")[1];
			subProtocol = 'http';
		} else {
			subConverter = subConverter.split("//")[1] || subConverter;
		}
		subConfig = env.SUBCONFIG || subConfig;
		FileName = env.SUBNAME || FileName;

		const currentDate = new Date();
		currentDate.setHours(0, 0, 0, 0);
		const timeTemp = Math.ceil(currentDate.getTime() / 1000);
		const fakeToken = await MD5MD5(`${mytoken}${timeTemp}`);
		guestToken = env.GUESTTOKEN || env.GUEST || guestToken;
		if (!guestToken) guestToken = await MD5MD5(mytoken);
		const 访客订阅 = guestToken;
		//console.log(`${fakeUserID}\n${fakeHostName}`); // 打印fakeID

		let UD = Math.floor(((timestamp - Date.now()) / timestamp * total * 1099511627776) / 2);
		total = total * 1099511627776;
		let expire = Math.floor(timestamp / 1000);
		SUBUpdateTime = env.SUBUPTIME || SUBUpdateTime;

		if (!([mytoken, fakeToken, 访客订阅].includes(token) || url.pathname == ("/" + mytoken) || url.pathname.includes("/" + mytoken + "?"))) {
			if (TG == 1 && url.pathname !== "/" && url.pathname !== "/favicon.ico") await sendMessage(`#异常访问 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgent}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
			if (env.URL302) return Response.redirect(env.URL302, 302);
			else if (env.URL) return await proxyURL(env.URL, url);
			else return new Response(await nginx(), {
				status: 200,
				headers: {
					'Content-Type': 'text/html; charset=UTF-8',
				},
			});
		} else {
			if (env.KV) {
				await 迁移地址列表(env, 'LINK.txt');
				if (userAgent.includes('mozilla') && !url.search) {
					await sendMessage(`#编辑订阅 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgentHeader}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
					return await KV(request, env, 'LINK.txt', 访客订阅);
				} else {
					MainData = await env.KV.get('LINK.txt') || MainData;
				}
			} else {
				MainData = env.LINK || MainData;
				if (env.LINKSUB) urls = await ADD(env.LINKSUB);
			}
			let 重新汇总所有链接 = await ADD(MainData + '\n' + urls.join('\n'));
			let 自建节点 = "";
			let 订阅链接 = "";
			for (let x of 重新汇总所有链接) {
				if (x.toLowerCase().startsWith('http')) {
					订阅链接 += x + '\n';
				} else {
					自建节点 += x + '\n';
				}
			}
			MainData = 自建节点;
			urls = await ADD(订阅链接);
			await sendMessage(`#获取订阅 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgentHeader}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
			const isSubConverterRequest = request.headers.get('subconverter-request') || request.headers.get('subconverter-version') || userAgent.includes('subconverter');
			let 订阅格式 = 'base64';
			if (!(userAgent.includes('null') || isSubConverterRequest || userAgent.includes('nekobox') || userAgent.includes(('CF-Workers-SUB').toLowerCase()))) {
				if (userAgent.includes('sing-box') || userAgent.includes('singbox') || url.searchParams.has('sb') || url.searchParams.has('singbox')) {
					订阅格式 = 'singbox';
				} else if (userAgent.includes('surge') || url.searchParams.has('surge')) {
					订阅格式 = 'surge';
				} else if (userAgent.includes('quantumult') || url.searchParams.has('quanx')) {
					订阅格式 = 'quanx';
				} else if (userAgent.includes('loon') || url.searchParams.has('loon')) {
					订阅格式 = 'loon';
				} else if (userAgent.includes('clash') || userAgent.includes('meta') || userAgent.includes('mihomo') || userAgent.includes('nyanpasu') || url.searchParams.has('clash')) {
					订阅格式 = 'clash';
				}
			}

			let subConverterUrl;
			let 订阅转换URL = `${url.origin}/${await MD5MD5(fakeToken)}?token=${fakeToken}`;
			//console.log(订阅转换URL);
			let req_data = MainData;

			let 追加UA = 'v2rayn';
			if (url.searchParams.has('b64') || url.searchParams.has('base64')) 订阅格式 = 'base64';
			else if (url.searchParams.has('clash')) 追加UA = 'clash';
			else if (url.searchParams.has('singbox')) 追加UA = 'singbox';
			else if (url.searchParams.has('surge')) 追加UA = 'surge';
			else if (url.searchParams.has('quanx')) 追加UA = 'Quantumult%20X';
			else if (url.searchParams.has('loon')) 追加UA = 'Loon';

			const 订阅链接数组 = [...new Set(urls)].filter(item => item?.trim?.()); // 去重
			if (订阅链接数组.length > 0) {
				const 请求订阅响应内容 = await getSUB(订阅链接数组, request, 追加UA, userAgentHeader);
				console.log(请求订阅响应内容);
				req_data += 请求订阅响应内容[0].join('\n');
				订阅转换URL += "|" + 请求订阅响应内容[1];
				if (订阅格式 == 'base64' && !isSubConverterRequest && 请求订阅响应内容[1].includes('://')) {
					subConverterUrl = `${subProtocol}://${subConverter}/sub?target=mixed&url=${encodeURIComponent(请求订阅响应内容[1])}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
					try {
						const subConverterResponse = await fetch(subConverterUrl, { headers: { 'User-Agent': 'v2rayN/CF-Workers-SUB  (https://github.com/cmliu/CF-Workers-SUB)' } });
						if (subConverterResponse.ok) {
							const subConverterContent = await subConverterResponse.text();
							req_data += '\n' + atob(subConverterContent);
						}
					} catch (error) {
						console.log('订阅转换请回base64失败，检查订阅转换后端是否正常运行');
					}
				}
			}

			if (env.WARP) 订阅转换URL += "|" + (await ADD(env.WARP)).join("|");
			//修复中文错误
			const utf8Encoder = new TextEncoder();
			const encodedData = utf8Encoder.encode(req_data);
			//const text = String.fromCharCode.apply(null, encodedData);
			const utf8Decoder = new TextDecoder();
			const text = utf8Decoder.decode(encodedData);

			//去重
			const uniqueLines = new Set(text.split('\n'));
			const result = [...uniqueLines].join('\n');
			//console.log(result);

			let base64Data;
			try {
				base64Data = btoa(result);
			} catch (e) {
				function encodeBase64(data) {
					const binary = new TextEncoder().encode(data);
					let base64 = '';
					const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

					for (let i = 0; i < binary.length; i += 3) {
						const byte1 = binary[i];
						const byte2 = binary[i + 1] || 0;
						const byte3 = binary[i + 2] || 0;

						base64 += chars[byte1 >> 2];
						base64 += chars[((byte1 & 3) << 4) | (byte2 >> 4)];
						base64 += chars[((byte2 & 15) << 2) | (byte3 >> 6)];
						base64 += chars[byte3 & 63];
					}

					const padding = 3 - (binary.length % 3 || 3);
					return base64.slice(0, base64.length - padding) + '=='.slice(0, padding);
				}

				base64Data = encodeBase64(result)
			}

			// 构建响应头对象
			const responseHeaders = {
				"content-type": "text/plain; charset=utf-8",
				"Profile-Update-Interval": `${SUBUpdateTime}`,
				"Profile-web-page-url": request.url.includes('?') ? request.url.split('?')[0] : request.url,
				//"Subscription-Userinfo": `upload=${UD}; download=${UD}; total=${total}; expire=${expire}`,
			};

			if (订阅格式 == 'base64' || token == fakeToken) {
				return new Response(base64Data, { headers: responseHeaders });
			} else if (订阅格式 == 'clash') {
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=clash&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
			} else if (订阅格式 == 'singbox') {
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=singbox&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
			} else if (订阅格式 == 'surge') {
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=surge&ver=4&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
			} else if (订阅格式 == 'quanx') {
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=quanx&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&udp=true`;
			} else if (订阅格式 == 'loon') {
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=loon&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false`;
			}
			//console.log(订阅转换URL);
			try {
				const subConverterResponse = await fetch(subConverterUrl, { headers: { 'User-Agent': userAgentHeader } });//订阅转换
				if (!subConverterResponse.ok) {
					if (订阅格式 == 'clash') {
						const anytlsYaml = buildAnytlsClashConfig(result);
						if (anytlsYaml) return new Response(anytlsYaml, { headers: responseHeaders });
					}
					return new Response(base64Data, { headers: responseHeaders });
				}
				let subConverterContent = await subConverterResponse.text();
				if (订阅格式 == 'clash') subConverterContent = await clashFix(subConverterContent);
				// 只有非浏览器订阅才会返回SUBNAME
				if (!userAgent.includes('mozilla')) responseHeaders["Content-Disposition"] = `attachment; filename*=utf-8''${encodeURIComponent(FileName)}`;
				return new Response(subConverterContent, { headers: responseHeaders });
			} catch (error) {
				if (订阅格式 == 'clash') {
					const anytlsYaml = buildAnytlsClashConfig(result);
					if (anytlsYaml) return new Response(anytlsYaml, { headers: responseHeaders });
				}
				return new Response(base64Data, { headers: responseHeaders });
			}
		}
	}
};

async function ADD(envadd) {
	var addtext = envadd.replace(/[	"'|\r\n]+/g, '\n').replace(/\n+/g, '\n');	// 替换为换行
	//console.log(addtext);
	if (addtext.charAt(0) == '\n') addtext = addtext.slice(1);
	if (addtext.charAt(addtext.length - 1) == '\n') addtext = addtext.slice(0, addtext.length - 1);
	const add = addtext.split('\n');
	//console.log(add);
	return add;
}

async function nginx() {
	const text = `
	<!DOCTYPE html>
	<html>
	<head>
	<title>Welcome to nginx!</title>
	<style>
		body {
			width: 35em;
			margin: 0 auto;
			font-family: Tahoma, Verdana, Arial, sans-serif;
		}
	</style>
	</head>
	<body>
	<h1>Welcome to nginx!</h1>
	<p>If you see this page, the nginx web server is successfully installed and
	working. Further configuration is required.</p>
	
	<p>For online documentation and support please refer to
	<a href="http://nginx.org/">nginx.org</a>.<br/>
	Commercial support is available at
	<a href="http://nginx.com/">nginx.com</a>.</p>
	
	<p><em>Thank you for using nginx.</em></p>
	</body>
	</html>
	`
	return text;
}

async function sendMessage(type, ip, add_data = "") {
	if (BotToken !== '' && ChatID !== '') {
		let msg = "";
		const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`);
		if (response.status == 200) {
			const ipInfo = await response.json();
			msg = `${type}\nIP: ${ip}\n国家: ${ipInfo.country}\n<tg-spoiler>城市: ${ipInfo.city}\n组织: ${ipInfo.org}\nASN: ${ipInfo.as}\n${add_data}`;
		} else {
			msg = `${type}\nIP: ${ip}\n<tg-spoiler>${add_data}`;
		}

		let url = "https://api.telegram.org/bot" + BotToken + "/sendMessage?chat_id=" + ChatID + "&parse_mode=HTML&text=" + encodeURIComponent(msg);
		return fetch(url, {
			method: 'get',
			headers: {
				'Accept': 'text/html,application/xhtml+xml,application/xml;',
				'Accept-Encoding': 'gzip, deflate, br',
				'User-Agent': 'Mozilla/5.0 Chrome/90.0.4430.72'
			}
		});
	}
}

function base64Decode(str) {
	const bytes = new Uint8Array(atob(str).split('').map(c => c.charCodeAt(0)));
	const decoder = new TextDecoder('utf-8');
	return decoder.decode(bytes);
}

async function MD5MD5(text) {
	const encoder = new TextEncoder();

	const firstPass = await crypto.subtle.digest('MD5', encoder.encode(text));
	const firstPassArray = Array.from(new Uint8Array(firstPass));
	const firstHex = firstPassArray.map(b => b.toString(16).padStart(2, '0')).join('');

	const secondPass = await crypto.subtle.digest('MD5', encoder.encode(firstHex.slice(7, 27)));
	const secondPassArray = Array.from(new Uint8Array(secondPass));
	const secondHex = secondPassArray.map(b => b.toString(16).padStart(2, '0')).join('');

	return secondHex.toLowerCase();
}

function clashFix(content) {
	const lineBreak = content.includes('\r\n') ? '\r\n' : '\n';
	const lines = content.split(/\r?\n/);

	const fixedWireguardLines = lines.map((line) => {
		if (line.includes('type: wireguard')) {
			const 备改内容 = `, mtu: 1280, udp: true`;
			const 正确内容 = `, mtu: 1280, remote-dns-resolve: true, udp: true`;
			return line.replace(new RegExp(备改内容, 'g'), 正确内容);
		}
		return line;
	});

	const fixedAnytlsLines = fixAnytlsProxies(fixedWireguardLines);
	const fixedUrlTestLines = fixUrlTestProbeUrl(fixedAnytlsLines);
	const fixedDnsLines = ensureClashDns(fixedUrlTestLines);
	return fixedDnsLines.join(lineBreak);
}

function fixUrlTestProbeUrl(lines) {
	return lines.map((line) => line.replace(/^(\s*url:\s*)http:\/\/www\.gstatic\.com\/generate_204\s*$/i, '$1https://www.gstatic.com/generate_204'));
}

function ensureClashDns(lines) {
	if (lines.some((line) => /^\s*dns:\s*$/i.test(line))) return lines;

	const dnsBlock = [
		'dns:',
		'  enable: true',
		'  ipv6: false',
		'  enhanced-mode: fake-ip',
		'  fake-ip-range: 198.18.0.1/16',
		'  default-nameserver:',
		'  - 223.5.5.5',
		'  - 119.29.29.29',
		'  nameserver:',
		'  - 223.5.5.5',
		'  - 119.29.29.29',
		'  - 1.1.1.1',
		'  fallback:',
		'  - 1.1.1.1',
		'  - 8.8.8.8'
	];

	let insertPos = lines.findIndex((line) => /^\s*log-level:\s*/i.test(line));
	if (insertPos === -1) insertPos = lines.findIndex((line) => /^\s*mode:\s*/i.test(line));
	if (insertPos === -1) insertPos = 0;
	else insertPos += 1;

	return [...lines.slice(0, insertPos), ...dnsBlock, ...lines.slice(insertPos)];
}

function fixAnytlsProxies(lines) {
	let section = '';
	let result = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const topLevelSection = line.match(/^([A-Za-z0-9_-]+):\s*$/);
		if (topLevelSection) section = topLevelSection[1];

		if (section === 'proxies' && /^\s*-\s+\{.*\}\s*$/.test(line)) {
			result.push(...expandInlineAnytlsProxy(line));
			continue;
		}

		if (section === 'proxies' && /^\s*-\s+name:\s*/.test(line)) {
			const block = [line];
			i++;
			while (i < lines.length) {
				const current = lines[i];
				if (/^[A-Za-z0-9_-]+:\s*$/.test(current) || /^\s*-\s+name:\s*/.test(current)) {
					i--;
					break;
				}
				block.push(current);
				i++;
			}
			result.push(...fixAnytlsBlock(block));
			continue;
		}

		result.push(line);
	}

	return result;
}

function fixAnytlsBlock(block) {
	const isAnytls = block.some((line) => /^\s*type:\s*anytls\s*$/i.test(line));
	if (!isAnytls) return block;

	let fixed = block.map((line) => line.replace(/^(\s*)fingerprint:(\s*)/i, '$1client-fingerprint:$2'));
	const indent = fixed.slice(1).find((line) => /^(\s+)[A-Za-z0-9_-]+:\s*/.test(line))?.match(/^(\s+)/)?.[1] || '  ';
	let insertPos = fixed.length;
	while (insertPos > 0 && fixed[insertPos - 1].trim() === '') insertPos--;

	const hasUdp = fixed.some((line) => /^\s*udp:\s*/i.test(line));
	const hasAlpn = fixed.some((line) => /^\s*alpn:\s*/i.test(line));
	const hasSkipCertVerify = fixed.some((line) => /^\s*skip-cert-verify:\s*/i.test(line));
	if (!hasUdp) {
		fixed.splice(insertPos, 0, `${indent}udp: true`);
		insertPos++;
	}
	if (!hasAlpn) {
		fixed.splice(insertPos, 0, `${indent}alpn:`, `${indent}  - h2`, `${indent}  - http/1.1`);
		insertPos += 3;
	}
	if (!hasSkipCertVerify) {
		fixed.splice(insertPos, 0, `${indent}skip-cert-verify: false`);
	}

	return fixed;
}

function splitInlineMapItems(content) {
	const items = [];
	let current = '';
	let quote = '';
	for (let i = 0; i < content.length; i++) {
		const ch = content[i];
		if ((ch === '"' || ch === "'") && content[i - 1] !== '\\') {
			if (!quote) quote = ch;
			else if (quote === ch) quote = '';
			current += ch;
			continue;
		}
		if (ch === ',' && !quote) {
			items.push(current.trim());
			current = '';
			continue;
		}
		current += ch;
	}
	if (current.trim()) items.push(current.trim());
	return items;
}

function expandInlineAnytlsProxy(line) {
	const match = line.match(/^(\s*)-\s+\{(.*)\}\s*$/);
	if (!match) return [line];

	const itemIndent = match[1];
	const pairText = match[2];
	const pairs = splitInlineMapItems(pairText).map((part) => {
		const idx = part.indexOf(':');
		if (idx === -1) return null;
		const key = part.slice(0, idx).trim();
		const value = part.slice(idx + 1).trim();
		return { key, value };
	}).filter(Boolean);

	if (!pairs.length) return [line];

	const getValue = (key) => {
		const pair = pairs.find((x) => x.key.toLowerCase() === key.toLowerCase());
		return pair ? pair.value : null;
	};
	const hasKey = (key) => pairs.some((x) => x.key.toLowerCase() === key.toLowerCase());

	const typeValue = getValue('type');
	if (!typeValue || typeValue.replace(/^['"]|['"]$/g, '').toLowerCase() !== 'anytls') {
		return [line];
	}

	for (const pair of pairs) {
		if (pair.key.toLowerCase() === 'fingerprint') pair.key = 'client-fingerprint';
	}
	if (!hasKey('client-fingerprint')) pairs.push({ key: 'client-fingerprint', value: 'chrome' });
	if (!hasKey('udp')) pairs.push({ key: 'udp', value: 'true' });
	if (!hasKey('skip-cert-verify')) pairs.push({ key: 'skip-cert-verify', value: 'false' });

	const lines = [];
	const first = pairs[0];
	lines.push(`${itemIndent}- ${first.key}: ${first.value}`);
	for (let i = 1; i < pairs.length; i++) {
		lines.push(`${itemIndent}  ${pairs[i].key}: ${pairs[i].value}`);
	}
	if (!hasKey('alpn')) {
		lines.push(`${itemIndent}  alpn:`);
		lines.push(`${itemIndent}    - h2`);
		lines.push(`${itemIndent}    - http/1.1`);
	}

	return lines;
}

async function proxyURL(proxyURL, url) {
	const URLs = await ADD(proxyURL);
	const fullURL = URLs[Math.floor(Math.random() * URLs.length)];

	// 解析目标 URL
	let parsedURL = new URL(fullURL);
	console.log(parsedURL);
	// 提取并可能修改 URL 组件
	let URLProtocol = parsedURL.protocol.slice(0, -1) || 'https';
	let URLHostname = parsedURL.hostname;
	let URLPathname = parsedURL.pathname;
	let URLSearch = parsedURL.search;

	// 处理 pathname
	if (URLPathname.charAt(URLPathname.length - 1) == '/') {
		URLPathname = URLPathname.slice(0, -1);
	}
	URLPathname += url.pathname;

	// 构建新的 URL
	let newURL = `${URLProtocol}://${URLHostname}${URLPathname}${URLSearch}`;

	// 反向代理请求
	let response = await fetch(newURL);

	// 创建新的响应
	let newResponse = new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	});

	// 添加自定义头部，包含 URL 信息
	//newResponse.headers.set('X-Proxied-By', 'Cloudflare Worker');
	//newResponse.headers.set('X-Original-URL', fullURL);
	newResponse.headers.set('X-New-URL', newURL);

	return newResponse;
}

async function getSUB(api, request, 追加UA, userAgentHeader) {
	if (!api || api.length === 0) {
		return [];
	} else api = [...new Set(api)]; // 去重
	let newapi = "";
	let 订阅转换URLs = "";
	let 异常订阅 = "";
	const controller = new AbortController(); // 创建一个AbortController实例，用于取消请求
	const timeout = setTimeout(() => {
		controller.abort(); // 2秒后取消所有请求
	}, 2000);

	try {
		// 使用Promise.allSettled等待所有API请求完成，无论成功或失败
		const responses = await Promise.allSettled(api.map(apiUrl => getUrl(request, apiUrl, 追加UA, userAgentHeader, controller.signal).then(response => response.ok ? response.text() : Promise.reject(response))));

		// 遍历所有响应
		const modifiedResponses = responses.map((response, index) => {
			// 检查是否请求成功
			if (response.status === 'rejected') {
				const reason = response.reason;
				if (reason && reason.name === 'AbortError') {
					return {
						status: '超时',
						value: null,
						apiUrl: api[index] // 将原始的apiUrl添加到返回对象中
					};
				}
				console.error(`请求失败: ${api[index]}, 错误信息: ${reason.status} ${reason.statusText}`);
				return {
					status: '请求失败',
					value: null,
					apiUrl: api[index] // 将原始的apiUrl添加到返回对象中
				};
			}
			return {
				status: response.status,
				value: response.value,
				apiUrl: api[index] // 将原始的apiUrl添加到返回对象中
			};
		});

		console.log(modifiedResponses); // 输出修改后的响应数组

		for (const response of modifiedResponses) {
			// 检查响应状态是否为'fulfilled'
			if (response.status === 'fulfilled') {
				const content = await response.value || 'null'; // 获取响应的内容
				if (content.includes('proxies:')) {
					//console.log('Clash订阅: ' + response.apiUrl);
					订阅转换URLs += "|" + response.apiUrl; // Clash 配置
				} else if (content.includes('outbounds"') && content.includes('inbounds"')) {
					//console.log('Singbox订阅: ' + response.apiUrl);
					订阅转换URLs += "|" + response.apiUrl; // Singbox 配置
				} else if (content.includes('://')) {
					//console.log('明文订阅: ' + response.apiUrl);
					newapi += content + '\n'; // 追加内容
				} else if (isValidBase64(content)) {
					//console.log('Base64订阅: ' + response.apiUrl);
					newapi += base64Decode(content) + '\n'; // 解码并追加内容
				} else {
					const 异常订阅LINK = `trojan://CMLiussss@127.0.0.1:8888?security=tls&allowInsecure=1&type=tcp&headerType=none#%E5%BC%82%E5%B8%B8%E8%AE%A2%E9%98%85%20${response.apiUrl.split('://')[1].split('/')[0]}`;
					console.log('异常订阅: ' + 异常订阅LINK);
					异常订阅 += `${异常订阅LINK}\n`;
				}
			}
		}
	} catch (error) {
		console.error(error); // 捕获并输出错误信息
	} finally {
		clearTimeout(timeout); // 清除定时器
	}

	const 订阅内容 = await ADD(newapi + 异常订阅); // 将处理后的内容转换为数组
	// 返回处理后的结果
	return [订阅内容, 订阅转换URLs];
}

async function getUrl(request, targetUrl, 追加UA, userAgentHeader, signal) {
	// 设置自定义 User-Agent
	const newHeaders = new Headers(request.headers);
	newHeaders.set("User-Agent", `${atob('djJyYXlOLzYuNDU=')} cmliu/CF-Workers-SUB ${追加UA}(${userAgentHeader})`);

	// 构建新的请求对象
	const modifiedRequest = new Request(targetUrl, {
		method: request.method,
		headers: newHeaders,
		body: request.method === "GET" ? null : request.body,
		redirect: "follow",
		signal,
		cf: {
			// 忽略SSL证书验证
			insecureSkipVerify: true,
			// 允许自签名证书
			allowUntrusted: true,
			// 禁用证书验证
			validateCertificate: false
		}
	});

	// 输出请求的详细信息
	console.log(`请求URL: ${targetUrl}`);
	console.log(`请求头: ${JSON.stringify([...newHeaders])}`);
	console.log(`请求方法: ${request.method}`);
	console.log(`请求体: ${request.method === "GET" ? null : request.body}`);

	// 发送请求并返回响应
	return fetch(modifiedRequest);
}

function isValidBase64(str) {
	// 先移除所有空白字符(空格、换行、回车等)
	const cleanStr = str.replace(/\s/g, '');
	const base64Regex = /^[A-Za-z0-9+/=]+$/;
	return base64Regex.test(cleanStr);
}

async function 迁移地址列表(env, txt = 'ADD.txt') {
	const 旧数据 = await env.KV.get(`/${txt}`);
	const 新数据 = await env.KV.get(txt);

	if (旧数据 && !新数据) {
		// 写入新位置
		await env.KV.put(txt, 旧数据);
		// 删除旧数据
		await env.KV.delete(`/${txt}`);
		return true;
	}
	return false;
}

async function KV(request, env, txt = 'ADD.txt', guest) {
	const url = new URL(request.url);
	try {
		// POST请求处理
		if (request.method === "POST") {
			if (!env.KV) return new Response("未绑定KV空间", { status: 400 });
			try {
				const content = await request.text();
				await env.KV.put(txt, content);
				return new Response("保存成功");
			} catch (error) {
				console.error('保存KV时发生错误:', error);
				return new Response("保存失败: " + error.message, { status: 500 });
			}
		}

		// GET请求部分
		let content = '';
		let hasKV = !!env.KV;

		if (hasKV) {
			try {
				content = await env.KV.get(txt) || '';
			} catch (error) {
				console.error('读取KV时发生错误:', error);
				content = '读取数据时发生错误: ' + error.message;
			}
		}

			const html = `
				<!DOCTYPE html>
				<html lang="zh-CN">
					<head>
						<title>${FileName} 订阅面板</title>
						<meta charset="utf-8">
						<meta name="viewport" content="width=device-width, initial-scale=1">
						<style>
							:root {
								--bg-0: #f4efe7;
								--bg-1: #e9f7f4;
								--card: rgba(255, 255, 255, 0.86);
								--stroke: rgba(25, 57, 84, 0.12);
								--text: #173954;
								--muted: #5f778b;
								--primary: #1f9d87;
								--primary-dark: #197a6a;
								--danger: #d63f4f;
							}
							* { box-sizing: border-box; }
							body {
								margin: 0;
								font-family: "Space Grotesk", "Manrope", "Avenir Next", "PingFang SC", "Microsoft YaHei", sans-serif;
								color: var(--text);
								background:
									radial-gradient(circle at 12% 18%, #ffd0a966 0, transparent 40%),
									radial-gradient(circle at 88% 6%, #8ec5ff44 0, transparent 32%),
									linear-gradient(125deg, var(--bg-0), var(--bg-1));
								min-height: 100vh;
							}
							.page {
								max-width: 1160px;
								margin: 0 auto;
								padding: 22px 14px 38px;
							}
							.hero {
								display: flex;
								flex-wrap: wrap;
								gap: 14px;
								align-items: center;
								justify-content: space-between;
								margin-bottom: 12px;
							}
							.hero h1 {
								margin: 0;
								font-size: clamp(24px, 3.2vw, 36px);
								letter-spacing: 0.4px;
							}
							.hero p {
								margin: 6px 0 0;
								color: var(--muted);
								font-size: 14px;
							}
							.badge {
								padding: 8px 12px;
								border-radius: 999px;
								background: #fff;
								border: 1px solid var(--stroke);
								font-size: 12px;
								color: #426078;
								box-shadow: 0 4px 12px rgba(12, 30, 49, 0.06);
							}
							.grid {
								display: grid;
								grid-template-columns: 1fr;
								gap: 14px;
							}
							.card {
								background: var(--card);
								border: 1px solid var(--stroke);
								border-radius: 18px;
								padding: 16px;
								box-shadow: 0 10px 28px rgba(12, 30, 49, 0.08);
								backdrop-filter: blur(8px);
							}
							.card h2 {
								margin: 0 0 12px;
								font-size: 18px;
							}
							.link-grid {
								display: grid;
								grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
								gap: 10px;
							}
							.link-item {
								border: 1px solid var(--stroke);
								border-radius: 14px;
								padding: 10px 12px;
								background: #ffffffcc;
							}
							.link-item .k {
								display: block;
								font-size: 12px;
								color: var(--muted);
								margin-bottom: 6px;
							}
							.sub-link {
								word-break: break-all;
								color: #0d5f95;
								text-decoration: none;
								font-size: 13px;
								line-height: 1.45;
							}
							.sub-link:hover { text-decoration: underline; }
							.qrcode-box {
								margin-top: 10px;
								min-height: 0;
							}
							.toggle-btn {
								border: 1px solid var(--stroke);
								background: #ffffffd9;
								color: var(--text);
								border-radius: 12px;
								padding: 8px 12px;
								cursor: pointer;
								font-weight: 700;
							}
							.notice-content {
								margin-top: 12px;
								padding-top: 12px;
								border-top: 1px dashed var(--stroke);
							}
							.kv {
								font-size: 13px;
								line-height: 1.6;
								color: #3f6179;
							}
							.kv strong { color: #0f3856; }
							.editor {
								width: 100%;
								height: min(46vh, 420px);
								margin-top: 10px;
								padding: 12px;
								border: 1px solid var(--stroke);
								border-radius: 14px;
								background: #fff;
								font-family: "SF Mono", "Roboto Mono", "Cascadia Code", "Consolas", monospace;
								font-size: 13px;
								line-height: 1.6;
								color: #20384d;
								resize: vertical;
							}
							.save-container {
								margin-top: 10px;
								display: flex;
								flex-wrap: wrap;
								align-items: center;
								gap: 10px;
							}
							.save-btn {
								padding: 8px 16px;
								border-radius: 12px;
								border: none;
								background: linear-gradient(120deg, var(--primary), var(--primary-dark));
								color: #fff;
								font-weight: 700;
								cursor: pointer;
							}
							.save-btn:disabled { opacity: 0.55; cursor: not-allowed; }
							.save-status { font-size: 13px; color: var(--muted); }
							.warn {
								border: 1px dashed #d7a25f;
								border-radius: 12px;
								padding: 10px 12px;
								background: #fff4e8;
								color: #785321;
							}
							.footer {
								font-size: 12px;
								line-height: 1.7;
								color: #547086;
							}
							.footer a { color: #0d5f95; text-decoration: none; }
							.footer a:hover { text-decoration: underline; }
							.toast {
								position: fixed;
								right: 16px;
								bottom: 16px;
								padding: 10px 14px;
								border-radius: 12px;
								background: #173954;
								color: #fff;
								font-size: 13px;
								opacity: 0;
								transform: translateY(10px);
								pointer-events: none;
								transition: 0.25s ease;
							}
							.toast.show {
								opacity: 1;
								transform: translateY(0);
							}
							@media (max-width: 768px) {
								.page { padding: 14px 10px 24px; }
								.card { border-radius: 14px; padding: 12px; }
								.hero h1 { font-size: 26px; }
							}
						</style>
						<script src="https://cdn.jsdelivr.net/npm/@keeex/qrcodejs-kx@1.0.2/qrcode.min.js"></script>
					</head>
					<body>
						<div class="page">
							<section class="hero">
								<div>
									<h1>${FileName}</h1>
									<p>汇聚订阅面板 · 复制链接后自动生成二维码</p>
								</div>
								<div class="badge">UA: ${request.headers.get('User-Agent')}</div>
							</section>

							<div class="grid">
								<section class="card">
									<h2>主订阅地址</h2>
									<div class="link-grid">
										<div class="link-item"><span class="k">自适应订阅</span><a class="sub-link" href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/${mytoken}?sub','qrcode_0')">https://${url.hostname}/${mytoken}</a><div class="qrcode-box" id="qrcode_0"></div></div>
										<div class="link-item"><span class="k">Base64</span><a class="sub-link" href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/${mytoken}?b64','qrcode_1')">https://${url.hostname}/${mytoken}?b64</a><div class="qrcode-box" id="qrcode_1"></div></div>
										<div class="link-item"><span class="k">Clash</span><a class="sub-link" href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/${mytoken}?clash','qrcode_2')">https://${url.hostname}/${mytoken}?clash</a><div class="qrcode-box" id="qrcode_2"></div></div>
										<div class="link-item"><span class="k">Singbox</span><a class="sub-link" href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/${mytoken}?sb','qrcode_3')">https://${url.hostname}/${mytoken}?sb</a><div class="qrcode-box" id="qrcode_3"></div></div>
										<div class="link-item"><span class="k">Surge</span><a class="sub-link" href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/${mytoken}?surge','qrcode_4')">https://${url.hostname}/${mytoken}?surge</a><div class="qrcode-box" id="qrcode_4"></div></div>
										<div class="link-item"><span class="k">Loon</span><a class="sub-link" href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/${mytoken}?loon','qrcode_5')">https://${url.hostname}/${mytoken}?loon</a><div class="qrcode-box" id="qrcode_5"></div></div>
									</div>
									<div style="margin-top:12px;"><button class="toggle-btn" id="noticeToggle" onclick="toggleNotice()">查看访客订阅∨</button></div>
									<div id="noticeContent" class="notice-content" style="display:none;">
										<div class="kv" style="margin-bottom:10px;">访客订阅只能使用订阅功能，无法查看配置页。<br>GUEST TOKEN: <strong>${guest}</strong></div>
										<div class="link-grid">
											<div class="link-item"><span class="k">访客自适应</span><a class="sub-link" href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/sub?token=${guest}','guest_0')">https://${url.hostname}/sub?token=${guest}</a><div class="qrcode-box" id="guest_0"></div></div>
											<div class="link-item"><span class="k">访客 Base64</span><a class="sub-link" href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/sub?token=${guest}&b64','guest_1')">https://${url.hostname}/sub?token=${guest}&b64</a><div class="qrcode-box" id="guest_1"></div></div>
											<div class="link-item"><span class="k">访客 Clash</span><a class="sub-link" href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/sub?token=${guest}&clash','guest_2')">https://${url.hostname}/sub?token=${guest}&clash</a><div class="qrcode-box" id="guest_2"></div></div>
											<div class="link-item"><span class="k">访客 Singbox</span><a class="sub-link" href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/sub?token=${guest}&sb','guest_3')">https://${url.hostname}/sub?token=${guest}&sb</a><div class="qrcode-box" id="guest_3"></div></div>
											<div class="link-item"><span class="k">访客 Surge</span><a class="sub-link" href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/sub?token=${guest}&surge','guest_4')">https://${url.hostname}/sub?token=${guest}&surge</a><div class="qrcode-box" id="guest_4"></div></div>
											<div class="link-item"><span class="k">访客 Loon</span><a class="sub-link" href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/sub?token=${guest}&loon','guest_5')">https://${url.hostname}/sub?token=${guest}&loon</a><div class="qrcode-box" id="guest_5"></div></div>
										</div>
									</div>
								</section>

								<section class="card">
									<h2>订阅转换配置</h2>
									<div class="kv">SUBAPI（后端）: <strong>${subProtocol}://${subConverter}</strong><br>SUBCONFIG（配置）: <strong>${subConfig}</strong></div>
								</section>

								<section class="card">
									<h2>${FileName} 汇聚订阅编辑</h2>
									${hasKV ? `
									<textarea class="editor" id="content" placeholder="每行一个链接，支持节点链接与订阅链接混合。示例:
vless://...
vmess://...
https://example.com/sub">${content}</textarea>
									<div class="save-container"><button class="save-btn" id="saveBtn" onclick="saveContent(this)">保存</button><span class="save-status" id="saveStatus"></span></div>
									` : '<div class="warn">请绑定 <strong>变量名称</strong> 为 <strong>KV</strong> 的 KV 命名空间。</div>'}
								</section>

								<section class="card footer">
									Telegram 交流群：<a href="https://t.me/CMLiussss" target="_blank" rel="noopener noreferrer">https://t.me/CMLiussss</a><br>
									GitHub 项目：<a href="https://github.com/cmliu/CF-Workers-SUB" target="_blank" rel="noopener noreferrer">https://github.com/cmliu/CF-Workers-SUB</a>
								</section>
							</div>
						</div>
						<div class="toast" id="toast"></div>
						<script>
						function showToast(message, isError) {
							const toast = document.getElementById('toast');
							toast.textContent = message;
							toast.style.background = isError ? '#b52439' : '#173954';
							toast.classList.add('show');
							clearTimeout(showToast.timer);
							showToast.timer = setTimeout(() => toast.classList.remove('show'), 1800);
						}

						function copyToClipboard(text, qrcode) {
							navigator.clipboard.writeText(text).then(() => {
								showToast('已复制到剪贴板');
							}).catch(err => {
								console.error('复制失败:', err);
								showToast('复制失败', true);
							});
							const qrcodeDiv = document.getElementById(qrcode);
							if (!qrcodeDiv) return;
							qrcodeDiv.innerHTML = '';
							new QRCode(qrcodeDiv, { text: text, width: 172, height: 172, colorDark: '#0f3653', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.Q });
						}
							
						if (document.querySelector('.editor')) {
							let timer;
							const textarea = document.getElementById('content');
							
							function replaceFullwidthColon() {
								const text = textarea.value;
								textarea.value = text.replace(/：/g, ':');
							}
							
							function saveContent(button) {
								const saveButton = button || document.getElementById('saveBtn');
								const statusElem = document.getElementById('saveStatus');
								const updateStatus = (message, isError) => {
									if (!statusElem) return;
									statusElem.textContent = message;
									statusElem.style.color = isError ? 'var(--danger)' : 'var(--muted)';
								};
								const resetButton = () => {
									if (!saveButton) return;
									saveButton.textContent = '保存';
									saveButton.disabled = false;
								};

								try {
									if (!textarea) throw new Error('找不到文本编辑区域');
									if (saveButton) { saveButton.textContent = '保存中...'; saveButton.disabled = true; }
									const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
									if (!isIOS) replaceFullwidthColon();
									const newContent = textarea.value || '';
									const originalContent = textarea.defaultValue || '';
									if (newContent === originalContent) { updateStatus('内容未变化', false); resetButton(); return; }

									fetch(window.location.href, {
										method: 'POST',
										body: newContent,
										headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
										cache: 'no-cache'
									})
									.then(response => {
										if (!response.ok) throw new Error('HTTP ' + response.status);
										const now = new Date().toLocaleString();
										document.title = '编辑已保存 ' + now;
										textarea.defaultValue = newContent;
										updateStatus('已保存 ' + now, false);
										showToast('保存成功');
									})
									.catch(error => {
										console.error('Save error:', error);
										updateStatus('保存失败: ' + error.message, true);
										showToast('保存失败', true);
									})
									.finally(() => {
										resetButton();
									});
								} catch (error) {
									console.error('保存过程出错:', error);
									updateStatus('错误: ' + error.message, true);
									resetButton();
								}
							}
							
							textarea.addEventListener('blur', () => saveContent());
							textarea.addEventListener('input', () => {
								clearTimeout(timer);
								timer = setTimeout(() => saveContent(), 5000);
							});
						}

						function toggleNotice() {
							const noticeContent = document.getElementById('noticeContent');
							const noticeToggle = document.getElementById('noticeToggle');
							if (!noticeContent || !noticeToggle) return;
							if (noticeContent.style.display === 'none' || noticeContent.style.display === '') {
								noticeContent.style.display = 'block';
								noticeToggle.textContent = '隐藏访客订阅∧';
							} else {
								noticeContent.style.display = 'none';
								noticeToggle.textContent = '查看访客订阅∨';
							}
						}
						
						document.addEventListener('DOMContentLoaded', () => {
							const block = document.getElementById('noticeContent');
							if (block) block.style.display = 'none';
						});
						</script>
					</body>
				</html>
			`;

		return new Response(html, {
			headers: { "Content-Type": "text/html;charset=utf-8" }
		});
	} catch (error) {
		console.error('处理请求时发生错误:', error);
		return new Response("服务器错误: " + error.message, {
			status: 500,
			headers: { "Content-Type": "text/plain;charset=utf-8" }
		});
	}
}

function yamlQuote(str = '') {
	return `"${String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function parseAnytlsLine(line) {
	try {
		if (!line || !line.toLowerCase().startsWith('anytls://')) return null;
		const u = new URL(line.trim());
		const params = u.searchParams;
		const rawName = u.hash ? decodeURIComponent(u.hash.slice(1)) : `${u.hostname}:${u.port}`;
		const insecure = params.get('insecure') || params.get('allowInsecure') || '0';
		const fp = params.get('fp') || params.get('fingerprint') || 'chrome';
		const sni = params.get('sni') || u.hostname;
		const port = Number(u.port || 443);
		if (!u.hostname || Number.isNaN(port)) return null;
		return {
			name: rawName,
			server: u.hostname,
			port,
			password: decodeURIComponent(u.username || ''),
			clientFingerprint: fp,
			sni,
			skipCertVerify: insecure === '1' || insecure.toLowerCase() === 'true'
		};
	} catch (e) {
		return null;
	}
}

function buildAnytlsClashConfig(mixedLinesText = '') {
	const lines = String(mixedLinesText || '').split('\n').map(s => s.trim()).filter(Boolean);
	const nodes = lines.map(parseAnytlsLine).filter(Boolean);
	if (!nodes.length) return '';

	const names = nodes.map(n => n.name);
	const proxiesYaml = nodes.map(n => (
`- name: ${yamlQuote(n.name)}
  type: anytls
  server: ${n.server}
  port: ${n.port}
  password: ${yamlQuote(n.password)}
  client-fingerprint: ${n.clientFingerprint}
  udp: true
  alpn:
  - h2
  - http/1.1
  sni: ${n.sni}
  skip-cert-verify: ${n.skipCertVerify ? 'true' : 'false'}`
	)).join('\n');

	const listYaml = names.map(n => `  - ${yamlQuote(n)}`).join('\n');

	return `port: 7890
socks-port: 7891
allow-lan: true
mode: Rule
log-level: info
dns:
  enable: true
  ipv6: false
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  default-nameserver:
  - 223.5.5.5
  - 119.29.29.29
  nameserver:
  - 223.5.5.5
  - 119.29.29.29
  - 1.1.1.1
  fallback:
  - 1.1.1.1
  - 8.8.8.8
proxies:
${proxiesYaml}
proxy-groups:
- name: "🚀 节点选择"
  type: select
  proxies:
  - "♻️ 自动选择"
${listYaml}
- name: "♻️ 自动选择"
  type: url-test
  url: https://www.gstatic.com/generate_204
  interval: 300
  tolerance: 50
  proxies:
${listYaml}
rules:
- MATCH,🚀 节点选择
`;
}
