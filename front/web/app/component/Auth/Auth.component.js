import { injector } from "../../../spa/Bootstrap.js";
import { AComponent } from "../../../spa/component/AComponent.js";
import { Router } from "../../../spa/Router.js";
import { UserService } from "../../service/User.service.js";
import { ButtonIconComponent } from "../ButtonIcon/ButtonIcon.component.js";
import { InputComponent } from "../Input/Input.Component.js";
import { NavBarComponent } from "../NavBar/NavBar.component.js"
import { TextButtonComponent } from "../textButton/TextButton.component.js";

export class AuthComponent extends AComponent {
    username = "";
    password = "";
    passwordConfirm = "";

    onInit() {
        if (injector[UserService].user) {
            injector[Router].navigate("/profile");
            return false;
        }
        super.onInit();
        this.generateHtml({});

        this.createSubComponent(new NavBarComponent(this.getSelector(), "navbar"));

        this.createSubComponent(InputComponent.create({
            name: "inputLogUser",
            parentSelector: this.getSelector(),
            inputType: "text",
            placeholder: "Jean-Michel",
            onchange: (value) => {this.username = value; this.logCheck()}
            }));
        this.createSubComponent(InputComponent.create({
            name: "inputLogPass",
            parentSelector: this.getSelector(),
            inputType: "password",
            placeholder: "********",
            autocomplete: `autocomplete="current-password"`,
            onchange: (value) => {this.password = value, this.logCheck()}
        }));
        this.createSubComponent(InputComponent.create({
            name: "inputRegUser",
            parentSelector: this.getSelector(),
            inputType: "text",
            placeholder: "Jean-Michel",
            onchange: (value) => {this.username = value; this.regCheck();}
        }));
        this.createSubComponent(InputComponent.create({
            name: "inputRegPass",
            parentSelector: this.getSelector(),
            inputType: "password",
            placeholder: "********",
            autocomplete: `autocomplete="new-password"`,
            onchange: (value) => {
                this.password = value;
                this.passwordCheck();
            }
        }));
        this.createSubComponent(InputComponent.create({
            name: "inputRegPassConfirm",
            parentSelector: this.getSelector(),
            inputType: "password",
            placeholder: "********",
            autocomplete: `autocomplete="new-password"`,
            onchange: (value) => {
                this.passwordConfirm = value;
                this.passwordCheck();
            }
        }));

        this.createSubComponent(ButtonIconComponent.create({
            name: "registerButton",
            parentSelector: this.getSelector(),
            icon: "arrow",
            style: "btn btn-outline-success",
            onclick: () => injector[UserService].register(this.username, this.password, this.passwordConfirm)
        }));
        this.createSubComponent(ButtonIconComponent.create({
            name: "loginButton",
            parentSelector: this.getSelector(),
            icon: "arrow",
            style: "btn btn-outline-success",
            onclick: () => injector[UserService].login(this.username, this.password)
        }));

        this.createSubComponent(TextButtonComponent.create({
            name: "fourtyTwoButton",
            parentSelector: this.getSelector(),
            langKey: "auth.42auth",
            onclick: () => injector[UserService].auth42(),
        }));

        this.setConfig({
            login: this.translate("auth.login"),
            register: this.translate("auth.register"),
            username: this.translate("auth.username"),
            password: this.translate("auth.password"),
            confirm: this.translate("auth.confirm"),
            usernameAdvert: this.translate("auth.usernameAdvert"),
        })
        this.logCheck();
        this.regCheck();

        return true;
    }

    passwordPolicyCheck(pwd) {
        const commonPassword = ['password', '123456', 'qwerty', `azerty`];
        return (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,30}$/.test(pwd) &&
            !commonPassword.includes(pwd.toLowerCase()) 
        );
    }

    passwordCheck() {
        if (!this.passwordPolicyCheck(this.password)) {
            this.subComponent["inputRegPass"].error.next(true);
            this.subComponent["inputRegPass"].errorText.next("auth.errorPolicy");
            this.subComponent["registerButton"].disabled.next(true);
        } else {
            this.subComponent["inputRegPass"].error.next(false);
            this.regCheck();
        }
        
        if (this.password !== this.passwordConfirm) {
            this.subComponent["inputRegPassConfirm"].error.next(true);
            this.subComponent["inputRegPassConfirm"].errorText.next("auth.errorText");
            this.subComponent["registerButton"].disabled.next(true);
        } else {
            this.subComponent["inputRegPassConfirm"].error.next(false);
            this.regCheck();
        }
    }

    logCheck() {
        if (this.username === "" || this.password === "") {
            this.subComponent["loginButton"].disabled.next(true);
        } else {
            this.subComponent["loginButton"].disabled.next(false);
        }
    }

    regCheck() {
        if (this.username === "" || this.password === "" || this.passwordConfirm === "") {
            this.subComponent["registerButton"].disabled.next(true);
        } else {
            this.subComponent["registerButton"].disabled.next(false);
        }
    }

    generateHtml(config) {
        this.html = `
        <div id="navbar"></div>
            <div class="container">
                <div class="row" >
                    <div class="container col-md-4 offset-md-1 mt-5">
                        <div class="containerBlur p-3">
                            <p class="fs-3 fw-bold text-light text-center">${config.login}</p>
                            <form>
                                <div class="mt-4 mb-4">
                                    <p class="fs-5 text-light">${config.username}</p>
                                    <div id="inputLogUser" class="mx-2"></div>
                                </div>
                                <div class="mb-4">
                                    <p class="fs-5 text-light">${config.password}</p>
                                    <div id="inputLogPass" class="mx-2"></div>
                                </div>
                            </form>  
                            <div class="d-flex justify-content-end me-3">
                            <div id="loginButton"></div>
                            </div>
                        </div>
                    </div>
                    <div class="container col-md-1 offset-md-1 mt-5">
                        <div class="containerBlur p-3 text-center text-info text-wrap">
                            <a id="fourtyTwoButton"></a>
                        </div>
                    </div>
                    <div class="container col-md-4 offset-md-1 mt-5">
                        <div class="containerBlur p-3">
                            <p class="fs-3 fw-bold text-light text-center">${config.register}</p>
                            <form>
                                <div class="mt-4 mb-4">
                                    <p class="fs-5 text-light">${config.username}</p>
                                    <div id="inputRegUser" class="mx-2"></div>
                                    <p class="fs-6 m-2 text-warning-emphasis">${config.usernameAdvert}</p>
                                </div>
                                <div class="mb-4">
                                    <p class="fs-5 text-light">${config.password}</p>
                                    <div id="inputRegPass" class="mx-2"></div>
                                </div>
                                <div class="mb-4">
                                    <p class="fs-5 text-light">${config.confirm}</p>
                                    <div id="inputRegPassConfirm" class="mx-2"></div>
                                </div>
                            </form>
                            <div class="d-flex justify-content-end me-3">
                            <div id="registerButton"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
}