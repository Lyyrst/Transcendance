import { AuthComponent } from "./component/Auth/Auth.component.js";
import { BattleshipComponent } from "./component/Battleship/Battleship.component.js";
import { BattleshipNewComponent } from "./component/BattleshipNew/BattleshipNew.component.js";
import { FriendsComponent } from "./component/Friends/Friends.component.js";
import { HomeComponent } from "./component/Home/Home.component.js";
import { NotFoundComponent } from "./component/NotFound/NotFound.component.js";
import { PongComponent } from "./component/Pong/Pong.component.js";
import { PongNewComponent } from "./component/PongNew/PongNew.component.js";
import { ProfileComponent } from "./component/Profile/Profile.component.js";
import { ProfileSettingsComponent } from "./component/ProfileSettings/ProfileSettings.component.js";
import { PublicProfileComponent } from "./component/PublicProfile/PublicProfile.component.js";
import { ResultComponent } from "./component/Result/Result.component.js";
import { TournamentComponent } from "./component/Tournament/Tournament.component.js";
import { TournamentMatchComponent } from "./component/TournamentMatch/TournamentMatch.component.js";
import { twoFaComponent } from "./component/twoFa/twoFa.component.js";
import { FriendsService } from "./service/Friends.service.js";
import { GameService } from "./service/Game.service.js";
import { PopService } from "./service/Pop.service.js";
import { TournamentService } from "./service/Tournament.service.js";
import { UserService } from "./service/User.service.js";

export function initRouter() {
	return [{
		path: "/",
		selector: "home",
		component: HomeComponent
	}, {
		path: "/auth",
		selector: "auth",
		component: AuthComponent
	}, {
		path: '/auth/twofa',
		selector: 'twofa',
		component: twoFaComponent
	},{
		path: "/pong/new",
		selector: "pongNew",
		component: PongNewComponent
	}, {
		path: '/battleship/new',
		selector: 'battleshipNew',
		component: BattleshipNewComponent,
	}, {
		path: "/profile",
		selector: "profile",
		component: ProfileComponent
	}, {
		path: "/profile/settings",
		selector: "profileSettings",
		component: ProfileSettingsComponent
	}, {
		path: "/pong",
		selector: "pong",
		component: PongComponent
	}, {
		path: "/battleship",
		selector: "battleship",
		component: BattleshipComponent
	}, {
		path: "/friends",
		selector: "friends",
		component: FriendsComponent
	}, {
		path: '/profile/:username',
		selector: "publicProfile",
		component: PublicProfileComponent
	}, {
		path: '/result',
		selector: 'result',
		component: ResultComponent
	}, {
		path: '/tournament',
		selector: 'tournament',
		component: TournamentComponent
	}, {
		path: '/tournament/match',
		selector: 'tournamentMatchComponent',
		component: TournamentMatchComponent
	}];
}

export function initErrorPage() {
	return {
		selector: "notFound",
		component: NotFoundComponent,
	};
}

export function initBootstrap() {
	let appInjector = {};
	appInjector[UserService] = new UserService().init();
	appInjector[GameService] = new GameService().init();
	appInjector[PopService] = new PopService().init();
	appInjector[FriendsService] = new FriendsService().init();
	appInjector[TournamentService] = new TournamentService().init();
	return appInjector;
}
