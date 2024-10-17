import { injector } from "../../spa/Bootstrap.js";
import { Router } from "../../spa/Router.js";
import { AInjectable } from "../../spa/service/AInjectable.js";
import { HttpClient } from "../../spa/service/HttpClient.js";
import { TokenService } from "../../spa/service/Token.service.js";
import { ReplayObservable } from "../../spa/utils/ReplayObservable.js";
import { TokenError} from "../../spa/error/TokenError.js"
import { PopService } from "./Pop.service.js";
import { TranslateService } from "../../spa/service/Translate.service.js";
import { TournamentService } from "./Tournament.service.js";
import { Observable } from "../../spa/utils/Observable.js";

export class UserService extends AInjectable {
	username = new ReplayObservable();
	defaultLang = new ReplayObservable();
	pfp = new ReplayObservable()
	isTfa = new ReplayObservable();
	tfaAccess = new ReplayObservable();
	userInformationsRender = new ReplayObservable();
	userProfileRender = new ReplayObservable();
	hasPassword = new ReplayObservable();
	hasMail = new ReplayObservable();
	renderHistory = new Observable();
	history = {};
	user = null
	isOnline = false;
	tempUsername = "";
	tempPassword = "";

	constructor() {
		super();
		this.username.subscribe(value => {
			if (value) {
				this.user.username = value;
			}
		})
		this.defaultLang.subscribe(value => {
			if (value) {
				this.user.defaultLang = value;
			}
		});
		this.pfp.subscribe(value => {
			if (value) {
				this.user.pfp = value;
			}
		});
		this.tfaAccess.next(false)
	}

	init() {
		this.isReady.next(false);
		this.getUser();
		return this;
	}

	auth42() {
		injector[HttpClient].get("42auth/login/").then(response => {
			if (response.redirect_url) {
				const authWindow = window.open(response.redirect_url, "_blank", "width=500,height=600");
				const checkTokens = setInterval(() => {
					const accessToken = injector[TokenService].getCookie('accessToken')
					const refreshToken = injector[TokenService].getCookie('refreshToken')
					const error = localStorage.getItem('error');
	
					if (accessToken && refreshToken) {
						clearInterval(checkTokens);
						injector[Router].navigate("/");
						injector[PopService].renderPop(true, "pop.loginSuccess");
						this.getUser();
						localStorage.removeItem('accessToken');
						localStorage.removeItem('refreshToken');
					} else if (error) {
						injector[Router].navigate("/auth");
						injector[PopService].renderPop(false, "pop.loginDanger");
						localStorage.removeItem('error');
					}
				}, 1000);
			}
		}).catch(error => {
			if (error instanceof TokenError) {
				injector[TokenService].deleteCookie();
			}
		});
	}
	
	register(username, password, passwordConfirm) {
			injector[HttpClient].put("register/", {
			username: username,
			password: password,
			password_confirm: passwordConfirm,
			lang: injector[TranslateService].current
		}).then(response => {
			if (response.ok) {
				this.login(username, password);
			} else if (response.error === "usernameError") {
				injector[PopService].renderPop(false, "pop.registerUsernameDanger");
			} else {
				injector[PopService].renderPop(false, "pop.registerDanger");
			}
		}).catch(error => {
			if (error instanceof TokenError) {
				injector[TokenService].deleteCookie();
			}
		});
	}

	login(username, password) {
		injector[HttpClient].post("login/", {
			username: username,
			password: password
		}).then(response => {
			if (response.ok === "tfa") {
				this.sendVerifyCode(response.username, response.password);
			} else if (response.ok) {
				injector[Router].navigate("/");
				injector[PopService].renderPop(true, "pop.loginSuccess");
				this.getUser();
			} else {
				injector[PopService].renderPop(false, "pop.loginDanger");
			}
		}).catch(error => {
			if (error instanceof TokenError) {
				injector[TokenService].deleteCookie();
			}
		});
	}

	logout() {
		injector[HttpClient].post("logout/", {}, true).then(response => {
			this.logoutManager("/", true, "pop.logout");
		});
	}

	sendVerifyCode(username, password) {
		injector[HttpClient].post("2faSetup/", {
			username: username,
			password: password
		}).then(response => {
			if (response.ok) {
				this.tempPassword = password;
				this.tempUsername = username;
				this.tfaAccess.next(true)
				injector[Router].navigate("/auth/twofa");
			} else {
				injector[PopService].renderPop(false, "pop.loginDangerTfa");
			}
		}).catch(error => {
			return ;
		})
	}

	verifyCode(code) {
		injector[HttpClient].post('2faVerify/', {
			code: code,
			username: this.tempUsername,
			password: this.tempPassword,
		}).then(response => {
			if (response.ok) {
				this.tempPassword = "";
				this.tempUsername = "";
				injector[Router].navigate("/");
				injector[PopService].renderPop(true, "pop.loginSuccess");
				this.getUser();
			} else {
				injector[PopService].renderPop(false, "pop.codeDangerTfa");
			}
		}).catch(error => {
			return ;
		});
	}

	activateTwofa(email) {
		email = this.hasMail.isEmpty() ? email : "currentMail";
		injector[HttpClient].post('2faActivate/', {
			email: email
		}, true).then(response => {
			if (response.ok) {
				injector[PopService].renderPop(true, "pop.tfaSuccess");
				this.getUser();
			} else {
				injector[PopService].renderPop(false, "pop.tfaDanger");
			}
		}).catch(error => {
			if (error instanceof TokenError) {
				injector[TokenService].deleteCookie();
			}
		});
	}

	deleteUser(password) {
		injector[HttpClient].post("deleteUser/", {
			password: password
		}, true).then(response => {
			if (response.ok) {
				this.logoutManager("/", true, "pop.deleteUserSuccess");
			} else {
				injector[PopService].renderPop(false, "pop.deleteUserDanger");
			}
		}).catch(error => {
			if (error instanceof TokenError) {
				injector[TokenService].deleteCookie();
			}
		});
	}

	deleteMail() {
		injector[HttpClient].post("deleteMail/", {}, true).then(response => {
			if (response.ok) {
				injector[PopService].renderPop(true, "pop.deleteMailSuccess");
				this.getUser();
			}
		}).catch(error => {
			if (error instanceof TokenError) {
				injector[TokenService].deleteCookie();
			}
		});
	}

	getUser() {
		if (injector[TokenService].getCookie('accessToken') || injector[TokenService].getCookie('refreshToken')) {
			injector[HttpClient].get("getUser/", {}, true).then(response => {
				if (response.ok) {
					this.isOnline = true;
					this.user = {
						username: response.username,
						defaultLang: response.lang,
						pfp: response.pfp,
						readyToPlay: false,
					}
					this.username.next(response.username);
					this.defaultLang.next(response.lang);
					this.pfp.next(response.pfp);
					this.isTfa.next(response.tfa)
					this.hasPassword.next(response.hasPassword);
					this.hasMail.next(response.mail);
					injector[TournamentService].isTournament.next(response.isTournament);
					if (response.isStarted) {
						injector[TournamentService].isStarted.next(response.isStarted);
					}
					injector[TranslateService].setLang(response.lang);
				}
			}).catch(error => {
				if (error instanceof TokenError) {
					injector[TokenService].deleteCookie();
				}
			}).finally(() => {
				this.isReady.next(true);
			});
		} else {
			this.isReady.next(true);
		}
	}

	getHistory() {
		injector[HttpClient].get('getHistory/', {}, true).then(response => {
			if (response.ok) {
				this.userProfileRender.next(true, true, true);
				if (response.match_history.length > 0) {
					this.history = response.match_history;
					this.renderHistory.next(response.match_history, true, true)
				} else {
					this.history = null;
					this.renderHistory.next(false, true, true);
				}
			}
		}).catch(error => {
			if (error instanceof TokenError) {
				injector[TokenService].deleteCookie();
			} else {
				injector[Router].navigate('/profile', true);
			}
		});
	}

	getUserInformations(username) {
		injector[HttpClient].post("getUserInformations/", {
			username: username
		}, true).then(response => {
			if (response.ok) {
				this.userInformationsRender.next(response.user);
				if (response.user.match_history.length > 0) {
					this.history = response.user.match_history;
					this.renderHistory.next(response.user.match_history, true, true)
				} else {
					this.history = null;
					this.renderHistory.next(false, true, true);
				}
			}
		}).catch(error => {
			if (error instanceof TokenError) {
				injector[TokenService].deleteCookie();
			}
		});
	}

	newMail(email) {
		email = this.hasMail.isEmpty() ? email : "currentMail";
		injector[HttpClient].post("newMail/", {
			email: email
		}, true).then(response => {
			if (response.ok) {
				this.hasPassword.next(true);
				injector[PopService].renderPop(true, "pop.mailSuccess");
				this.getUser();
			} else {
				injector[PopService].renderPop(false, "pop.mailDanger");
			}
		}).catch(error => {
			if (error instanceof TokenError) {
				injector[TokenService].deleteCookie();
			}
		});
	}

	patchMail(email) {
		injector[HttpClient].post("patchMail/", {
			email: email
		}, true).then(response => {
			if (response.ok) {
				this.hasMail.next(true);
				injector[PopService].renderPop(true, "pop.patchMailSuccess");
			} else {
				injector[PopService].renderPop(false, "pop.patchMailDanger");
			}
		}).catch(error => {
			if (error instanceof TokenError) {
				injector[TokenService].deleteCookie();
			}
		});
	}

	getPersonalData() {
		injector[HttpClient].get("getUserData/", {}, true).then(response => {
			if (response.ok) {
				const dataStr = JSON.stringify(response.userData);
				const blob = new Blob([dataStr], {type: "application/JSON"});
				const url = URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = url;
				link.download = "personal_data.json";
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			}
		}).catch(error => {
			if (error instanceof TokenError) {
				injector[TokenService].deleteCookie();
			}
		});
	}

	patchDefaultLang(newDefaultLang) {
		injector[HttpClient].patch("updateLanguage/", {
			lang: newDefaultLang
		}, true).then(response => {
			this.isOnline = true;
			if (response.ok) {
				this.defaultLang.next(newDefaultLang);
				injector[PopService].renderPop(true, "pop.defaultLangSuccess");
			} else {
				injector[PopService].renderPop(false, "pop.defaultLangDanger");
			}
		}).catch(error => {
			if (error instanceof TokenError) {
				this.logoutManager("/auth", false, "pop.reconnect");
			}
		})
	}

	patchPassword(currentPassword, newPassword, newPasswordConfirm) {
		injector[HttpClient].patch("updatePassword/", {
			currentPassword: currentPassword,
			newPassword: newPassword,
			newPasswordConfirm: newPasswordConfirm
		}, true).then(response => {
			this.isOnline = true;
			if (response.ok) {
				injector[PopService].renderPop(true, "pop.passwordSuccess");
			} else {
				injector[PopService].renderPop(false, "pop.passwordDanger");
			}
		}).catch(error => {
			if (error instanceof TokenError) {
				this.logoutManager("/auth", false, "pop.reconnect");
			};
		});
	}

	patchUsername(newUsername) {
		injector[HttpClient].patch("updateUsername/", {
			username: newUsername
		}, true).then(response => {
			this.isOnline = true;
			if (response.ok) {
				this.username.next(newUsername);
				injector[PopService].renderPop(true, "pop.usernameSuccess");
			} else {
				injector[PopService].renderPop(false, "pop.usernameDanger");
			}
		}).catch(error => {
			if (error instanceof TokenError) {
				this.logoutManager("/auth", false, "pop.reconnect");
			};
		});
	}

	patchPfp(newPfp) {
		const formData = new FormData();
		formData.append('pfp', newPfp);
		injector[HttpClient].patch("updatePfp/", formData, true, true).then(response => {
			this.isOnline = true;
			if (response.ok) {
				this.getPfp();
				injector[PopService].renderPop(true, "pop.pfpSuccess");
			} else {
				injector[PopService].renderPop(false, "pop.pfpDanger");
			}
		}).catch(error => {
			if (error instanceof TokenError) {
				this.logoutManager("/auth", false, "pop.reconnect");
			};
		});
	}

	deletePfp() {
		injector[HttpClient].delete("deletePfp/", {}, true).then(response => {
			if (response.ok) {
				this.getPfp();
				injector[PopService].renderPop(true, "pop.deletePfpSuccess");
			} else {
				injector[PopService].renderPop(false, "pop.deletePfpDanger");
			}
		}).catch(error => {
			if (error instanceof TokenError) {
				this.logoutManager("/auth", false, "pop.reconnect");
			};
		});
	}

	getPfp() {
		injector[HttpClient].get("getPfp/", {}, true).then(response => {
			this.isOnline = true;
			if (response.ok) {
				this.pfp.next(response.pfp);
			} else {
				this.pfp.next(null);
			}
		}).catch (error => {
			if (error instanceof TokenError) {
				this.logoutManager("/auth", false, "pop.reconnect");
			};
		});
	}

	logoutManager(path, popStatus, popMessage) {
		this.isOnline = false;
		this.user = null;
		injector[TokenService].deleteCookie();
		injector[Router].navigate(path);
		injector[PopService].renderPop(popStatus, popMessage);
		this.username.next(undefined);
	}

}