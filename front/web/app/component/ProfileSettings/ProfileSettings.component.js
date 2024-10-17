import { injector } from "../../../spa/Bootstrap.js";
import { AComponent } from "../../../spa/component/AComponent.js";
import { Router } from "../../../spa/Router.js";
import { TranslateService } from "../../../spa/service/Translate.service.js";
import { UserService } from "../../service/User.service.js";
import { ButtonIconComponent } from "../ButtonIcon/ButtonIcon.component.js";
import { InputComponent } from "../Input/Input.Component.js";
import { InputFileComponent } from "../InputFile/InputFile.component.js";
import { NavBarComponent } from "../NavBar/NavBar.component.js";
import { RadioIconComponent } from "../RadioIcon/RadioIcon.component.js";

export class ProfileSettingsComponent extends AComponent {
	username = injector[UserService].username;
	hasPassword = injector[UserService].hasPassword;
	hasTfa = injector[UserService].isTfa;
	hasMail = injector[UserService].hasMail;
	newUsername = "";
	currentPassword = "";
	newPassword = "";
	newPasswordConfirm = ""
	defaultLang = "";
	deleteUserPassword = "";
	email = "";
	tfamail = "";
	patchMail = "";
	pfp = null;

	onInit() {
		if (!injector[UserService].user) {
            injector[Router].navigate("/auth");
			return false;
        }

		super.onInit();
		this.generateHtml({});

		this.createSubComponent(new NavBarComponent(this.getSelector(), "navbar"));

		this.createSubComponent(InputFileComponent.create({
			name: "inputPP",
			parentSelector: this.getSelector(),
			onchange: (value) => this.pfp = value,
		}));
		this.createSubComponent(ButtonIconComponent.create({
			name: "profilePictureModifier",
			parentSelector: this.getSelector(),
			icon: "modifier",
			style: "btn",
			onclick: () => injector[UserService].patchPfp(this.pfp)
		}));
		this.createSubComponent(ButtonIconComponent.create({
			name: "deletePP",
			parentSelector: this.getSelector(),
			icon: "delete",
			style: "btn btn-outline-danger",
			onclick: () => injector[UserService].deletePfp()
		}));

		this.createSubComponent(ButtonIconComponent.create({
			name: "usernameModifier",
			parentSelector: this.getSelector(),
			icon: "modifier",
			style: "btn",
			onclick: () => injector[UserService].patchUsername(this.newUsername)
		}));
		this.createSubComponent(InputComponent.create({
			name: "usernameInput",
			parentSelector: this.getSelector(),
			inputType: "text",
			onchange: (value) => this.newUsername = value
		}));

		this.createSubComponent(ButtonIconComponent.create({
			name: "passwordModifier",
			parentSelector: this.getSelector(),
			icon: "modifier",
			style: "btn",
			onclick: () => injector[UserService].patchPassword(this.currentPassword, this.newPassword, this.newPasswordConfirm)
		}));
		this.createSubComponent(InputComponent.create({
			name: "currentPasswordInput",
			parentSelector: this.getSelector(),
			inputType: "password",
			autocomplete: `autocomplete="new-password"`,
			placeholder: "********",
			onchange: (value) => {this.currentPassword = value; this.pwdCheck();}
		}));
		this.createSubComponent(InputComponent.create({
			name: "newPasswordInput",
			parentSelector: this.getSelector(),
			inputType: "password",
			autocomplete: `autocomplete="new-password"`,
			placeholder: "********",
			onchange: (value) => {this.newPassword = value; this.pwdInputCheck();}
		}));
		this.createSubComponent(InputComponent.create({
			name: "newPasswordConfirmInput",
			parentSelector: this.getSelector(),
			inputType: "password",
			autocomplete: `autocomplete="new-password"`,
			placeholder: "********",
			onchange: (value) => {this.newPasswordConfirm = value; this.pwdInputCheck();}
		}));

		this.createSubComponent(InputComponent.create({
			name: "mailInput",
			parentSelector: this.getSelector(),
			inputType: "text",
			placeholder: "example@gmail.com",
			onchange: (value) => this.email = value
		}));
		this.createSubComponent(ButtonIconComponent.create({
			name: "mailButton",
			parentSelector: this.getSelector(),
			icon: "modifier",
			style: "btn",
			onclick: () => injector[UserService].newMail(this.email)
		}));

		this.createSubComponent(new RadioIconComponent(this.getSelector(), "langageRadio"));
		this.subComponent["langageRadio"].radioSelectSubscribe((value) => {
			this.defaultLang = value;
			if (value) {
				injector[TranslateService].setLang(value);
			}	
		});
		this.createSubComponent(ButtonIconComponent.create({
			name: "defaultLangModifier",
			parentSelector: this.getSelector(),
			icon: "modifier",
			style: "btn",
			onclick: () => injector[UserService].patchDefaultLang(this.defaultLang)
		}));

		this.createSubComponent(ButtonIconComponent.create({
			name: "encryptButton",
			parentSelector: this.getSelector(),
			icon: "check",
			style: "btn",
			onclick: () => injector[UserService].deleteMail(),
			id: 0,
		}));

		this.createSubComponent(ButtonIconComponent.create({
			name: "getPersonalDataButton",
			parentSelector: this.getSelector(),
			icon: "download",
			style: "btn btn-outline-warning",
			onclick: () => injector[UserService].getPersonalData(),
			id: 0,
		}));

		this.createSubComponent(ButtonIconComponent.create({
			name: "policyButton",
			parentSelector: this.getSelector(),
			icon: "download",
			style: "btn btn-outline-warning",
			onclick : () => this.downloadPolicy(),
			id: 1,
		}));

		this.createSubComponent(InputComponent.create({
			name: "deleteUserPassword",
			parentSelector: this.getSelector(),
			inputType: "password",
			autocomplete: `autocomplete="password"`,
			placeholder: "********",
			onchange: value => this.deleteUserPassword = value,
		}));
		this.createSubComponent(ButtonIconComponent.create({
			name: "deleteUserButton",
			icon: "check",
			parentSelector: this.getSelector(),
			style: "btn btn-outline-danger",
			onclick: () => injector[UserService].deleteUser(this.deleteUserPassword),
			id: 1,
		}));

		this.createSubComponent(InputComponent.create({
			name: 'inputTfaMail',
			parentSelector: this.getSelector(),
			inputType: "text",
			placeholder: "example@gmail.com",
			onchange: (value) => this.tfamail = value,
		}));
		this.createSubComponent(ButtonIconComponent.create({
			name: 'tfaMailButton',
			parentSelector: this.getSelector(),
			style: 'btn',
			icon: 'modifier',
			onclick: () => injector[UserService].activateTwofa(this.tfamail),
		}));

		this.createSubComponent(InputComponent.create({
			name: 'patchMailInput',
			parentSelector: this.getSelector(),
			inputType: "text",
			placeholder: "example@gmail.com",
			onchange: (value) => this.patchMail = value,
		}));
		this.createSubComponent(ButtonIconComponent.create({
			name: 'patchMailButton',
			parentSelector: this.getSelector(),
			style: 'btn',
			icon: 'modifier',
			onclick: () => injector[UserService].patchMail(this.patchMail),
		}));

		this.createSubComponent(ButtonIconComponent.create({
			name: "deleteMail",
			parentSelector: this.getSelector(),
			icon: "delete",
			style: "btn btn-outline-danger",
			onclick: () => injector[UserService].deleteMail()
		}));

		this.setConfig({
			username: this.username,
			currentPassword: this.translate("profileSettings.currentPassword"),
			newPassword: this.translate("profileSettings.newPassword"),
			newPasswordConfirm: this.translate("profileSettings.newPasswordConfirm"),
			lang: this.translate("profileSettings.lang"),
			dataTitle: this.translate("profileSettings.dataTitle"),
			dataEncrypt: this.translate("profileSettings.dataEncrypt"),
			dataGet: this.translate("profileSettings.dataGet"),
			getPolicy: this.translate("profileSettings.getPolicy"),
			deleteUserTitle: this.translate("profileSettings.deleteUserTitle"),
			deleteUserPassword: this.translate("profileSettings.deleteUserPassword"),
			deleteUserAdvert: this.translate("profileSettings.deleteUserAdvert"),
			getPassword: this.translate("profileSettings.getPassword"),
			tfaTitle: this.translate("profileSettings.tfaTitle"),
			patchMail: this.translate("profileSettings.patchMail"),
			maxFileSize: this.translate('profileSettings.maxFileSize'),
			hasPassword: this.hasPassword,
			hasTfa: this.hasTfa,
			hasMail: this.hasMail,
		});

		this.pwdCheck()
		return true;
	}

	downloadPolicy() {
		const link = document.createElement('a');
		link.href = 'app/assets/policy.txt';
		link.download = 'policy.txt';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	passwordPolicyCheck(pwd) {
        const commonPassword = ['password', '123456', 'qwerty', `azerty`];
        return (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,30}$/.test(pwd) &&
            !commonPassword.includes(pwd.toLowerCase()) 
        );
    }

	pwdInputCheck() {
		if (!this.passwordPolicyCheck(this.newPassword)) {
			this.subComponent["newPasswordInput"].error.next(true);
			this.subComponent["newPasswordInput"].errorText.next("auth.errorPolicy");
			this.subComponent["passwordModifier"].disabled.next(true);
		} else {
			this.subComponent["newPasswordInput"].error.next(false);
			this.pwdCheck();
		}

		if(this.newPassword !== this.newPasswordConfirm) {
			this.subComponent["newPasswordConfirmInput"].error.next(true);
			this.subComponent["newPasswordConfirmInput"].errorText.next("auth.errorText");
			this.subComponent["passwordModifier"].disabled.next(true);
		} else {
			this.subComponent["newPasswordConfirmInput"].error.next(false);
			this.pwdCheck();
		}
	}

	pwdCheck() {
		if (this.currentPassword === "" || this.newPassword === "" || this.newPasswordConfirm === "") {
			this.subComponent["passwordModifier"].disabled.next(true);
		} else {
			this.subComponent["passwordModifier"].disabled.next(false);
		}
	}

	generateHtml(config) {
		this.html = `
			<div id="navbar"></div>
			<div class="container">
				<div class="containerBlur">
					<div class="fs-2 fw-bold text-light m-4">
						<span>Profile Settings</span>
					</div>
					<div class="row m-3">
						<div class="fs-3 text-light text-center">
							<div class="d-flex justify-content-center m-3">
								<div id="inputPP"></div>
							</div>
							<div class='fs-5 text-warning-emphasis'>${config.maxFileSize}</div>
							<div id="profilePictureModifier"></div>
							<div id="deletePP"></div>
						</div>
					</div>
					<div class="line my-4"></div>
					<div class="row m-3">
						<div>
							<div class="fs-3 text-light text-center">${config.username}</div>
							<div class="d-flex justify-content-center m-3">
								<div id="usernameInput" class="inputContainer"></div>
							</div>
							<div class="text-center">
								<div id="usernameModifier"></div>
							</div>
						</div>
					</div>
					<div class="line my-4"></div>
					<div class="row m-3">
						<div style="${config.hasPassword ? `` : `display: none;`}">
							<form>
								<div class="fs-3 text-light text-center">${config.currentPassword}</div>
								<div class="d-flex justify-content-center m-3">
									<div id="currentPasswordInput" class="inputContainer"></div>
								</div>
								<div class="fs-3 text-light text-center">${config.newPassword}</div>
								<div class="d-flex justify-content-center m-3">
									<div id="newPasswordInput" class="inputContainer"></div>
								</div>
								<div class="fs-3 text-light text-center">${config.newPasswordConfirm}</div>
								<div class="d-flex justify-content-center m-3">
									<div id="newPasswordConfirmInput" class="inputContainer"></div>
								</div>
							</form>
							<div class="text-center">
								<div id="passwordModifier"></div>
							</div>
						</div>
						<div style="${config.hasPassword ? `display: none;` : ``}">
							<div class="fs-3 text-light text-center">${config.getPassword}</div>
							<div style="${config.hasMail ? `display: none;` : ``}">
								<div class="d-flex justify-content-center m-3">
									<div id="mailInput" class="inputContainer"></div>
								</div>
							</div>
							<div class="d-flex justify-content-center m-3">
								<div id="mailButton"></div>
							</div>
						</div>
					</div>
					<div style="${config.hasTfa ? `display: none;` : ``}">
						<div class="line my-4"></div>
						<div class="row m-3">
							<div class="fs-3 text-light text-center">${config.tfaTitle}</div>
							<div style="${config.hasMail ? `display: none;` : ``}">
								<div class="d-flex justify-content-center m-3">
									<div id="inputTfaMail" class="inputContainer"></div>
								</div>
							</div>
							<div class="text-center">
								<div id="tfaMailButton"></div>
							</div>
						</div>
					</div>
					<div style="${config.hasMail ? `` : `display: none;`}">
						<div class="line my-4"></div>
							<div class="row m-3">
								<div>
									<div class="fs-3 text-light text-center">${config.patchMail}</div>
									<div class="d-flex justify-content-center m-3">
										<div id="patchMailInput" class="inputContainer"></div>
									</div>
									<div class="text-center">
										<div id="patchMailButton" class="m-2"></div>
										<div id="deleteMail"></div>
									</div>
								</div>
							</div>
						</div>
					<div class="line my-4"></div>
						<div class="row m-3">
							<div>
								<div class="fs-3 text-light text-center">${config.lang}</div>
								<div class="d-flex justify-content-center m-3">
									<div id="langageRadio"></div>
								</div>
								<div class="d-flex justify-content-center m-3">
									<div id="defaultLangModifier"></div>
								</div>
							</div>
						</div>
					<div class="line my-4"></div>
						<div class="row m-3">
							<div class="text-center mt-2">
								<div class="fs-5 text-light">${config.dataEncrypt}</div>
								<div class="d-flex justify-content-center">
									<div id="encryptButton" class="ms-3"></div>
								</div>
							</div>
					<div class="line my-4"></div>
							<div class="text-center mt-2">
								<div class="fs-5 text-light">${config.dataGet}</div>
								<div class="d-flex justify-content-center m-3">
									<div id="getPersonalDataButton" class="mx-3"></div>
								</div>
							</div>
					<div class="line my-4"></div>
						<div class="text-center mt-2">
							<div class="fs-5 text-light">${config.getPolicy}</div>
							<div class="d-flex justify-content-center m-3">
								<div id="policyButton" class="mx-3"></div>
							</div>
						</div>
					<div class="line my-4"></div>
						<div class="text-center mt-2">
							<div class="fs-3 fw-bold text-danger">${config.deleteUserTitle}</div>
							<form>
								<div class="d-flex justify-content-center m-3">
									<div id="deleteUserPassword" class="inputContainer"></div>
								</div>
							</form>
							<div class="fs-5 text-danger">${config.deleteUserPassword}</div>
							<div class="fs-5 text-danger">${config.deleteUserAdvert}</div>
							<div id="deleteUserButton" class="m-3"></div>
						</div>
					</div>
				</div>
			</div>
		`;
	}
}