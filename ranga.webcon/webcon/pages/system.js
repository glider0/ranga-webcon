var page_system = {};

page_system.$ = id => {
	return document.getElementById('p-system-' + id);
}

page_system.optSvcMap = {
	aria2: [true, 'Aria2 下载管理器', '启动后，可以通过 PRC（远程过程调用）访问 Aria2 下载管理器，以进行下载文件等操作。'],
	samba: [true, 'Samba 文件共享服务', '启动后，可以通过 SMB 协议进行文件共享，以访问挂载的额外主文件系统。']
}

page_system.optSvcSetMisc = (misc, value) => {
	ranga.api.config('misc', ['set-misc', misc, value]).then(proto => {
		dialog.toast('修改已提交，但可能需要重启此服务以生效。');
	}).catch(defErrorHandler)
}

page_system.optSvcExtraAction = (name, arg1, arg2) => {
	ranga.api.action('opt', ['action', name, arg1, arg2]).then(proto => {
		dialog.toast('修改已提交，但可能需要重启此服务以生效。')
	}).catch(defErrorHandler);
}

page_system.optSvcAction = (action, name) => {
	switch (action) {
		case 'config':
			let dlg = dialog.show(null, null, '', [{
				name: '关闭',
				func: dialog.close
			}]);
			utils.ajaxGet('opt/' + name + '.html').then(r => {
				dialog.textWidget(dlg).innerHTML = r;
			});
			break;
		case 'start':
		case 'stop':
		case 'restart':
			webcon.lockScreen();
			ranga.api.action('opt', [action, name]).then(proto => {
				dialog.toast('服务已收到请求。操作应该很快完成。')
			}).catch(defErrorHandler).finally(() => {
				webcon.unlockScreen();
			})
			break;
	}
}

page_system.optSvcAuto = (name, checkbox) => {
	let action = 'disable';
	if (checkbox.checked)
		action = 'enable';

	webcon.lockScreen();
	ranga.api.action('opt', [action, name]).then(proto => {
		dialog.toast('已经更新自动启动配置。')
	}).catch(e => {
		defErrorHandler(e);
		checkbox.checked = !checkbox.checked;
	}).finally(() => {
		webcon.unlockScreen();
	})
}

const page_system_init = () => {
	page_system.$('syncdate').addEventListener('click', e => {
		let ts = utils.getUNIXTimestamp();
		ranga.api.action('date', ['' + ts]).then(proto => {
			dialog.toast("系统时钟已更新。");
		}).catch(defErrorHandler);
	});

	page_system.$('date').addEventListener('click', e => {
		let ts = parseInt(page_system.$('unixtime').value);
		ranga.api.action('date', ['' + ts]).then(proto => {
			dialog.toast("系统时钟已更新。");
		}).catch(defErrorHandler);
	});

	page_system.$('reboot').addEventListener('click', e => {
		ranga.api.action('restart', ['system']).then(proto => {
			dialog.simple('系统即将重新启动，Web 控制台不会自动刷新。');
		}).catch(defErrorHandler);
	});

	page_system.$('log').addEventListener('click', e => {
		ranga.api.query('log', []).then(proto => {
			dialog.show(null, null, "<pre>" + utils.raw2HTMLString(proto.payload) + "</pre>", [
				{
					name: "保存到文件",
					func: (d => {
						let blob = new Blob([proto.payload], {
							type: "text/plain;charset=utf-8"
						});
						let a = document.createElement("a"),
							url = URL.createObjectURL(blob);
						a.href = url;
						a.download = "ranga.log";
						document.body.appendChild(a);
						a.click();
						setTimeout(() => {
							document.body.removeChild(a);
							window.URL.revokeObjectURL(url);
						}, 0);
					})
				},
				{
					name: "好",
					func: dialog.close
				}
			]);
		}).catch(defErrorHandler);
	});

	page_system.$('chpw').addEventListener('click', e => {
		let passwd = page_system.$('passwd').value,
			passwd2 = page_system.$('passwd2').value;
		if (passwd === '') {
			dialog.simple("不允许使用空白密码");
			return;
		}
		if (passwd !== passwd2) {
			dialog.simple("两次输入的密码不一致，请重新输入");
			return;
		}
		ranga.api.config('misc', ['set-passwd', passwd]).then(proto => {
			dialog.simple("修改密码成功");
		}).catch(defErrorHandler);
	});


	let optEnabled = new Set();
	ranga.api.action('opt', ['ls-enabled']).then(proto => {
		proto.payload.split('\n').forEach(i => {
			if (i !== '')
				optEnabled.add(i);
		});
		console.log(optEnabled);
		return ranga.api.action('opt', ['ls']);
	}).then(proto => {
		let div = page_system.$('opts');
		div.textContent = '';
		let itemT = page_system.$('item_t');
		let hasItem = false;

		webcon.lockScreen();
		proto.payload.split('\n').forEach(i => {
			if (i === '')
				return;

			hasItem = true;

			let name = i,
				desc = '',
				config = false;

			if (i in page_system.optSvcMap) {
				name = page_system.optSvcMap[i][1];
				desc = page_system.optSvcMap[i][2];
				config = page_system.optSvcMap[i][0];
			}

			let item = itemT.cloneNode(true);
			item.getElementsByClassName('p-system-item-name')[0].textContent = name;
			item.getElementsByClassName('p-system-item-info')[0].innerHTML = desc;
			if (config) {
				let tmp = item.getElementsByClassName('p-network-item-btn-config')[0];
				tmp.classList.remove('hide');
				tmp.addEventListener('click', ((f, a, b) => e => f(a, b))(page_system.optSvcAction, 'config', i));
			}
			item.getElementsByClassName('p-system-item-btn-start')[0].addEventListener('click', ((f, a, b) => e => f(a, b))(page_system.optSvcAction, 'start', i));
			item.getElementsByClassName('p-system-item-btn-stop')[0].addEventListener('click', ((f, a, b) => e => f(a, b))(page_system.optSvcAction, 'stop', i));
			item.getElementsByClassName('p-system-item-btn-restart')[0].addEventListener('click', ((f, a, b) => e => f(a, b))(page_system.optSvcAction, 'restart', i));
			let tmp = item.getElementsByClassName('p-system-item-auto')[0];
			if (optEnabled.has(i))
				tmp.checked = true;
			let genid = "p-system-item-auto-cb-" + i;
			tmp.id = genid;
			item.getElementsByClassName('p-system-item-auto-label')[0].htmlFor = genid;
			tmp.addEventListener('change', ((f, a) => e => f(a, e.target))(page_system.optSvcAuto, i));

			item.classList.remove('hide');
			div.appendChild(item);
		})

		if (!hasItem) {
			div.textContent = '未安装任何额外（可选）服务';
		}
	}).catch(defErrorHandlerPage).finally(() => {
		webcon.unlockScreen();
	});
}
