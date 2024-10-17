import { injector } from "../../../spa/Bootstrap.js";
import { AComponent } from "../../../spa/component/AComponent.js";
import { UserService } from "../../service/User.service.js";

export class TablesRowComponent extends AComponent {
	isRelativeHtml = true;

	onInit() {
		super.onInit();
		this.generateHtml({});

		if (injector[UserService].history) {
			Object.keys(injector[UserService].history).forEach(id => {
				const match = injector[UserService].history[id];
				document.querySelector(this.getSelector()).innerHTML += `
					<tr>
						<td class='px-3 text-success fw-semibold'>${match.winner}</td>
						<td class="px-3 text-success">${match.winner_score}</td>
						<td class="px-3 text-danger">${match.looser_score}</td>
						<td class="px-3 text-danger">${match.looser}</td>
						<td class="px-3 text-light">${match.date_played}</td>
						<td class="px-3 fw-bold gameTitle">${match.is_pong ? 'Pong' : 'BattleShip'}</td>
					</tr>
				`
			});
		}

		return true;
	};

	generateHtml(config) {
		this.html = `
			<div></div>
		`;
	}
}