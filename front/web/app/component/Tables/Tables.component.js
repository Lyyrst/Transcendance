import { injector } from "../../../spa/Bootstrap.js";
import { AComponent } from "../../../spa/component/AComponent.js";
import { UserService } from "../../service/User.service.js";
import { TablesRowComponent } from "./TablesRow.component.js";

export class TablesComponent extends AComponent {
	renderHistory = injector[UserService].renderHistory;
	renderHistorySubscription = "";

	onInit() {
		super.onInit();

		this.renderHistorySubscription = this.renderHistory.subscribe(() => {
			this.createSubComponent(new TablesRowComponent(this.getSelector(), 'historyList'));
		});
		
		this.setConfig({
			renderHistory: this.renderHistory,
			noHistory: this.translate('tables.noHistory'),
			game: this.translate('tables.game'),
			pong: this.translate('tables.pong'),
			battle: this.translate('tables.battle'),
			winner: this.translate("tables.winner"),
			winnerScore: this.translate("tables.winnerScore"),
			looser: this.translate("tables.looser"),
			looserScore: this.translate("tables.looserScore"),
			date: this.translate("tables.date")
		});

		return true;
	}

	destroy() {
		super.destroy();
		if (this.renderHistorySubscription) {
			this.renderHistory.unsubscribe(this.renderHistorySubscription);
		}
	}
	
	getCSSPath() {
		return "app/component/Tables/Tables.component.css";
	}

	generateHtml(config) {
		this.html = `
		<div style="${config.renderHistory ? `` : `display: none;`}">
			<div class='row'>
				<table class="text-light fs-5 col-md-12">
					<thead class="text-center">
						<tr>
							<th scope="col" class="px-3 py-1">${config.winner}</th>
							<th scope="col" class="px-3 py-1">${config.winnerScore}</th>
							<th scope="col" class="px-3 py-1">${config.looserScore}</th>
							<th scope="col" class="px-3 py-1">${config.looser}</th>
							<th scope="col" class="px-3 py-1">${config.date}</th>
							<th scope="col" class="px-3 py-1">${config.game}</div>
						</tr>
					</thead>
					<tbody id='historyList' class="table-group-divider text-center">
					</tbody>
				</table>
			</div>
		</div>
		<div style="${config.renderHistory ? `display: none;` : ``}">
			<div class='fs-3 text-danger text-center m-5'>${config.noHistory}</div>
		</div>
		`;
	}
}