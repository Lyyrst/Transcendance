import { injector } from "../../../spa/Bootstrap.js";
import { AComponent } from "../../../spa/component/AComponent.js";
import { Router } from "../../../spa/Router.js";
import { TournamentService } from "../../service/Tournament.service.js";
import { UserService } from "../../service/User.service.js";
import { ButtonIconComponent } from "../ButtonIcon/ButtonIcon.component.js";
import { MatchesListComponent } from "../MatchesList/MatchesList.component.js";
import { NavBarComponent } from "../NavBar/NavBar.component.js";

export class TournamentMatchComponent extends AComponent {
	renderMatches = injector[TournamentService].renderMatches
	renderMatchesSubscription = null;
	winner = injector[TournamentService].winner

	onInit() {
		if (!injector[UserService].user) {
			injector[Router].navigate('/auth');
			return false;
		}
		super.onInit();

        this.createSubComponent(new NavBarComponent(this.getSelector(), 'navbar'));
		this.renderMatchesSubscription = this.renderMatches.subscribe(() => {
        	this.createSubComponent(new MatchesListComponent(this.getSelector(), "matchesList"));
		});

		this.createSubComponent(ButtonIconComponent.create({
			name: 'nextMatchButton',
			parentSelector: this.getSelector(),
			icon: 'arrow',
			style: 'btn btn-outline-success',
			onclick: () => injector[TournamentService].nextMatch(),
		}));
		this.createSubComponent(ButtonIconComponent.create({
			name: 'closeTournamentButton',
			parentSelector: this.getSelector(),
			icon: 'delete',
			style: 'btn btn-outline-danger',
			onclick: () => injector[TournamentService].close(),
		}));

		this.setConfig({
			winner: this.winner,
			winnerTitle: this.translate('tournament.winnerTitle'),
			playingTitle: this.translate('tournament.playingTitle'),
			renderMatches: this.renderMatches,
		});

		injector[TournamentService].getState();

		return true;
	}

	destroy() {
		super.destroy();
		if (this.renderMatchesSubscription) {
			this.renderMatches.unsubscribe(this.renderMatchesSubscription);
		}
	}

	getCSSPath() {
        return "app/component/TournamentMatch/TournamentMatch.component.css";
    }

	generateHtml(config) {
		this.html = `
			<div id='navbar'></div>
			<div class='container'>
				<div class='containerBlur'>
					<div style="${config.winner ? `display: none;` : ``}">
						<div class='fs-2 m-3 fw-bold text-center text-light tournamentMatchTitle'>${config.playingTitle}</div>
						<div id='matchesList'></div>
						<div class='line my-4'></div>
					</div>
					<div style="${config.winner ? `` : `display: none;`}">
						<div class='fs-1 text-center fw-bold m-3 tournamentMatchTitle'>${config.winnerTitle}</div>
						<div class='fs-1 text-center fw-bold winner m-3'>${config.winner}</div>
					</div>
						<div id='nextMatchButton' class='text-center'></div>
						<div id='closeTournamentButton' class='text-center m-3'></div>'
				</div>
			</div>
		`;
	}
}