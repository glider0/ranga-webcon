var webcon = {};
var scriptSet = new Set();

webcon.supportSiteMain = "https://glider0.github.io";

webcon.setToken = value => {
	document.cookie = "USER_TOKEN=" + value + "; path=/cgi-bin";
}

webcon.loadScript = (name, url) => {
	const promise = new Promise((resolve, reject) => {
		console.log("webcon.loadScript: name: " + name);
		if (name === null || scriptSet.has(name) === false) {
			let script = document.createElement("script");
			script.type = 'text/javascript';
			script.src = url;
			script.onload = () => {
				console.log("webcon.loadScript: script " + name + " loaded (" + url + ")");
				resolve(true);
			};
			script.onerror = () => {
				scriptSet.delete(name);
				console.log("webcon.loadScript: script " + name + " failed to load (" + url + ")");
				reject();
			};
			document.body.appendChild(script);
			scriptSet.add(name);

		} else {
			console.log("webcon.loadScript: script " + name + " has loaded");
			resolve(false);
		}
	});

	return promise;
}

webcon.addButton = (title, icon, func) => {
	let btn = document.createElement('button');
	btn.classList.add('btnFlat');
	let tmp = document.createElement('i');
	tmp.classList.add('icon');
	tmp.classList.add(icon);
	btn.appendChild(tmp);
	tmp = document.createElement('span');
	tmp.textContent = title;
	btn.appendChild(tmp);
	btn.addEventListener('click', ((f, a) => e => f(a))(func, btn), false);
	document.getElementById('webcon_buttons').appendChild(btn);
}

webcon.removeAllButtons = () => {
	document.getElementById('webcon_buttons').textContent = '';
}

webcon.contentSetTitle = title => {
	document.getElementById('webcon_title').innerHTML = title;
}

webcon.contentLoadData = (data, html) => {
	if (html) {
		document.getElementById('webcon_content').innerHTML = data;
	} else {
		document.getElementById('webcon_content').textContent = data;
	}
}

webcon.contentLoadUri = (uri, html) => {
	return utils.ajaxGet(uri).then(r => {
		webcon.contentLoadData(r, html);
	});
}

webcon.lockScreenDialogStack = [];

webcon.lockScreen = text => {
	if (utils.isNil(text))
		text = '请稍候';

	text = '<div class="circular" style="margin: 2px;"><svg><circle class="path" cx="24" cy="24" r="20" fill="none" stroke-width="3" stroke-miterlimit="10" /></svg></div><span style="margin-left: 10px">' + text + '</span>';

	let tmp = dialog.adv(null, null, text, [], {
		noMinHeight: 1
	});

	let widget = dialog.textWidget(tmp);
	widget.classList.add('flexRowCenter');

	webcon.lockScreenDialogStack.push(tmp);

	return tmp;
}

webcon.unlockScreen = () => {
	let tmp = webcon.lockScreenDialogStack.pop();
	if (!utils.isNil(tmp)) {
		dialog.close(tmp);
	}
}

webcon.updateScreenLockTextWidget = (dlg, text) => {
	if (!utils.isNil(dlg)) {
		dialog.textWidget(dlg).getElementsByTagName('span')[0].innerHTML = text;
	}
}

webcon.dropDownMenu = (e, list) => {
	let menu_wrapper = document.createElement('div'),
		menu = document.createElement('div');
	menu_wrapper.classList.add('menu_wrapper');
	menu.classList.add('menu');

	list.forEach(i => {
		let btn = document.createElement('button');
		btn.textContent = i.name;
		btn.addEventListener('click', ((f, a) => e => {
			e.stopPropagation();
			e.preventDefault();
			f(a);
			menu_wrapper.parentElement.removeChild(menu_wrapper);
		})(i.func, null), false);
		menu.appendChild(btn);
	});

	menu_wrapper.appendChild(menu);

	let back = document.createElement('div');
	back.classList.add('menu_back');
	back.addEventListener('click', e => {
		e.stopPropagation();
		e.preventDefault();
		menu_wrapper.parentElement.removeChild(menu_wrapper);
	});
	menu_wrapper.appendChild(back);

	//e.parentNode.insertBefore(menu_wrapper, e.nextSibling);
	e.style.position = 'relative';
	e.appendChild(menu_wrapper);

	return menu_wrapper;
}

webcon.kwdMap = {
	netkeeper: '基于以太网的点对点协议（Netkeeper）',
	pppoe: '基于以太网的点对点协议',
	dhcp: '动态主机配置协议',
	none: '未配置',
	static: '静态'
}

webcon.trKeyword = keyword => {
	if (keyword in webcon.kwdMap) {
		return webcon.kwdMap["" + keyword];
	}
	return keyword;
}

webcon.sendNotify = (id, icon, title, text, theme, allowClose, btns) => {
	id = "notify-" + id;
	let tmp = document.getElementById(id);
	if (!utils.isNil(tmp))
		return tmp;

	let div = document.getElementById('webcon_notify');
	let itemT = document.getElementById('notify_t');

	let item = itemT.cloneNode(true);
	let btnArea = item.getElementsByClassName('notify_btns')[0];
	item.id = id;

	if (utils.isNil(title)) {
		item.getElementsByClassName('notify_title')[0].classList.add('hide');
	} else {
		item.getElementsByClassName('notify_title_text')[0].textContent = title;
		item.getElementsByClassName('icon')[0].classList.add(icon);
	}

	item.getElementsByClassName('notify_text')[0].innerHTML = text;

	for (var i = 0; i < btns.length; i++) {
		var button = document.createElement("button");
		button.classList.add('btnFlat');
		button.addEventListener('click', ((f, a) => e => f(a))(btns[i].func, item), false);
		button.textContent = btns[i].name;
		btnArea.appendChild(button);
	}

	if (allowClose) {
		var button = document.createElement("button");
		button.classList.add('btnFlat');
		button.addEventListener('click', ((f, a) => e => f(a))(webcon.closeNotify, item), false);
		button.textContent = "关闭";
		btnArea.appendChild(button);
	}

	item.classList.add('notify_theme_' + theme);
	item.classList.remove('hide');
	div.appendChild(item);

	item.scrollIntoView();

	return item;
}

webcon.closeNotify = notify => {
	notify.remove();
}

webcon.onlineInited = false;
webcon.setupOnlineScript = () => {
	if (webcon.onlineInited) return;
	webcon.onlineInited = true;

	let scriptname = 'main.js';
	if (utils.getLocalStorageItem('disable-nswa-online') !== 'true') {
		if (utils.getLocalStorageItem('nswa-online-debug-channel') === 'true') {
			scriptname = 'main-debug.js';
		}
		webcon.loadScript("online", webcon.supportSiteMain + "/nswa/online.ranga/" + scriptname).then(a => {
			eval("nswaOnlineInit(1)");
		}).catch(e => {
			webcon.loadScript("online_mirror", "https://fytlc.coding.me/ranga-mirror/nswa/online.ranga/" + scriptname).then(a => {
				eval("nswaOnlineInit(1)");
			}).catch(e => {
				console.log("Can not load NSWA Online");
			});
		});
	}
}

webcon.reloadTheme = () => {
	let tmp = document.getElementById('_USER_THEME');
	if (!utils.isNil(tmp)) {
		tmp.parentElement.removeChild(tmp);
	}
	utils.idbGet('theme', 'custom-css').then(result => {
		if (!utils.isNil(result)) {
			if (result.theme_compat !== '1') {
				webcon.sendNotify('theme-not-compat', 'icon-warning', '当前使用的第三方主题与 Web 控制台不兼容', '请从第三方主题来源检查更新的版本，以获取和最新 Web 控制台兼容的主题。', 'info', true, []);
			} else {
				webconThemeUUID = (utils.isNil(result.theme_uuid) ? "UNKNOWN" : result.theme_uuid);
				let s = document.createElement("style");
				s.id = '_USER_THEME';
				s.innerHTML = result.data;
				document.getElementsByTagName("head")[0].appendChild(s);
			}
		}
	});

}

webcon.listenForExternalRequest = () => {
	window.addEventListener('message', e => {
		let data = e.data,
			origin = e.origin;
		console.log(data);
		switch (data.type) {
			case 'set-theme':
				if (!('theme_css' in data) || !('theme_uuid' in data) || !('theme_version' in data) || !('theme_compat' in data)) {
					return;
				}

				dialog.show('icon-warning', '外部应用程序请求', '位于 <b>' + utils.raw2HTMLString(utils.URIDomain(origin)) + '</b> 的站点正试图向你的 NSWA Ranga 的 Web 控制台设置自定义主题。安装第三方主题可能会导致 Web 控制台外观被恶意篡改，从而使你受骗。' + (origin.startsWith('https:') ? '' : '<br><br>您与此站点的连接不是私密连接。这意味着你的数据未经加密在互联网上传输，这可能导致主题被恶意替换。'), [{
					name: '继续',
					func: (d => {
						if (data.theme_uuid === 'default') {
							utils.idbRemove('theme', 'custom-css').then(() => {
								dialog.close(d);
								webcon.reloadTheme();
							});
						} else {
							utils.idbPut('theme', {
								id: 'custom-css',
								data: data.theme_css,
								theme_uuid: data.theme_uuid,
								theme_version: data.theme_version,
								theme_compat: data.theme_compat
							}).then(() => {
								dialog.close(d);
								webcon.reloadTheme();
							});
						}
					})
					}, {
					name: '拒绝',
					func: dialog.close
					}]);
				break;
			case 'inst-ext':
				if (!('ext_blob' in data)) {
					return;
				}
				dialog.show('icon-warning', '外部应用程序请求', '位于 <b>' + utils.raw2HTMLString(utils.URIDomain(origin)) + '</b> 的站点正试图向你的 NSWA Ranga 安装扩展程序。安装第三方扩展程序可能对 NSWA Ranga 系统性能和稳定性产生不良影响。请仅在十分清楚的情况下继续操作。' + (origin.startsWith('https:') ? '' : '<br><br>您与此站点的连接不是私密连接。这意味着你的数据未经加密在互联网上传输，这可能导致扩展程序被恶意替换。'), [{
					name: '继续',
					func: (d => {
						let passwd = prompt('若要安装扩展程序，您必须经过认证\n\n输入超级用户密码继续', 'ranga');
						ranga.api.auth(passwd).then(proto => {
							webcon.setToken(proto.payload);
							webcon.lockScreen('正在安装扩展程序');
							return ranga.api.addonInstall(data.ext_blob);
						}).then(proto => {
							dialog.simple("<pre>" + utils.raw2HTMLString(proto.payload) + "</pre>");
						}).catch(defErrorHandler).finally(() => {
							dialog.close(d);
							webcon.unlockScreen();
						});
					})
					}, {
					name: '拒绝',
					func: dialog.close
					}]);
				break;
		}
	});
}
