import { injector } from "../../../spa/Bootstrap.js";
import { AComponent } from "../../../spa/component/AComponent.js";
import { Router } from "../../../spa/Router.js";
import { UserService } from "../../service/User.service.js";
import { ButtonIconComponent } from "../ButtonIcon/ButtonIcon.component.js";
import { InputComponent } from "../Input/Input.Component.js";
import { NavBarComponent } from "../NavBar/NavBar.component.js";

export class twoFaComponent extends AComponent {
    code = "";
    isTfa = injector[UserService].isTfa

    onInit() {
        if (injector[UserService].tfaAccess.isEmpty()) {
            injector[Router].navigate("/auth");
			return false;
        }
        super.onInit();

		this.createSubComponent(new NavBarComponent(this.getSelector(), "navbar"));
       
        this.createSubComponent(InputComponent.create({
            name: 'codeInput',
            parentSelector: this.getSelector(),
            inputType: 'text',
            autocomplete: 'verification code',
            onchange: (value) => this.code = value
        }));
        this.createSubComponent(ButtonIconComponent.create({
            name: 'codeButton',
            parentSelector: this.getSelector(),
            icon: 'modifier',
            style: 'btn btn-outline-success',
            onclick: () => injector[UserService].verifyCode(this.code)
        }));

        this.setConfig({
            title: this.translate("twoFa.title"),
            titleDanger: this.translate("twoFa.titleDanger"),
            isTfa: this.isTfa,
        });
    }

    generateHtml(config) {
        this.html = `
            <div id='navbar'></div>
            <div class="container">
                <div class="containerBlur mt-5">
                    <div class="text-center text-light m-5" style="${config.isTfa ? `` : `display: none;`}">
                        <div class="fs-2">${config.title}</div>
                        <div class="d-flex justify-content-center m-3">
                            <div id="codeInput"></div>
                        </div>
                        <div id="codeButton"></div>
                    </div>
                    <div class="text-center m-5" style="${config.isTfa ? `display: none;` : ``}">
                        <div class="fs-2 text-danger">${config.titleDanger}</div>
                    </div>
                </div>
            </div>
        `;
    }
}