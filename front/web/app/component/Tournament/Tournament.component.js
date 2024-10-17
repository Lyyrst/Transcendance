import { injector } from "../../../spa/Bootstrap.js";
import { AComponent } from "../../../spa/component/AComponent.js";
import { Router } from "../../../spa/Router.js";
import { TournamentService } from "../../service/Tournament.service.js";
import { UserService } from "../../service/User.service.js";
import { ButtonIconComponent } from "../ButtonIcon/ButtonIcon.component.js";
import { InputListComponent } from "../InputList/InputList.component.js";
import { NavBarComponent } from "../NavBar/NavBar.component.js";

export class TournamentComponent extends AComponent {
    isTournament = injector[TournamentService].isTournament;
    isStarted = injector[TournamentService].isStarted;
    renderInput = injector[TournamentService].renderInput;
    renderInputSubscription = null;
    usernameList = [];

    onInit() {
        if (!injector[UserService].user) {
            injector[Router].navigate('/auth');
            return false;
        }
        super.onInit();

        this.createSubComponent(new NavBarComponent(this.getSelector(), 'navbar'));
        
        this.createSubComponent(ButtonIconComponent.create({
            name: 'sendListButton',
            parentSelector: this.getSelector(),
            style: 'btn btn-outline-success',
            icon: 'modifier',
            onclick: () => injector[TournamentService].sendList(this.subComponent['inputList'].usernameList),
        }));
        this.createSubComponent(ButtonIconComponent.create({
            name: 'toMatchButton',
            parentSelector: this.getSelector(),
            style: 'btn btn-outline-success',
            icon: 'arrow',
            onclick: () => injector[Router].navigate('/tournament/match'),
        }));

        this.renderInputSubscription = this.renderInput.subscribe(() => {
            this.createSubComponent(new InputListComponent(this.getSelector(), "inputList"));
        });

        this.setConfig({
            isTournament: this.isTournament,
            isStarted: this.isStarted,
            renderInputList: this.renderInput,
            noTournament: this.translate('tournament.noTournament'),
            tournamentAdvert: this.translate('tournament.tournamentAdvert'),
            inputTitle: this.translate('tournament.inputTitle'),
            inputAdvert: this.translate('tournament.inputAdvert'),
            toMatch: this.translate('tournament.toMatch'),
        });

        injector[TournamentService].getState();

        return true;
    }

    destroy() {
		super.destroy();
		if (this.renderInputSubscription) {
			this.renderInput.unsubscribe(this.renderInputSubscription);
		}
	}

    getCSSPath() {
        return "app/component/Tournament/Tournament.component.css";
    }

    generateHtml(config) {
        this.html = `
            <div id='navbar'></div>
            <div class='container'>
                <div class='containerBlur mt-5'>
                    <div style="${config.isTournament ? `` : `display: none;`}">
                        <div style="${config.isStarted ? `display: none;` : ``}">
                            <div class='fs-3 fw-bold text-center text-light tournamentTitle'>${config.inputTitle}</div>
                            <div class='fs-5 fw-bold text-center text-warning-emphasis'>${config.inputAdvert}</div>
                            <div class='text-center m-3'>
                                <div id='inputList'></div>
                            </div>
                            <div class='m-5 text-center'>
                                <div id='sendListButton'></div>
                            </div>
                        </div>
                        <div style="${config.isStarted ? `` : `display: none;`}">
                            <div class='fs-3 fw-semibold text-success text-center m-2'>${config.toMatch}</div>
                            <div id='toMatchButton'></div>
                        </div>
                    </div>
                    <div style="${config.isTournament ? `display: none;` : ``}">
                        <div class="fs-3 fw-semibold text-danger text-center m-2">${config.noTournament}</div>
                        <div class='fs-5 text-warning text-center m-2'>${config.tournamentAdvert}</div>
                    </div>
                </div>
            </div>
        `;
    }
}