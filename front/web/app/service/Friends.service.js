import { injector } from "../../spa/Bootstrap.js";
import { TokenError } from "../../spa/error/TokenError.js";
import { AInjectable } from "../../spa/service/AInjectable.js";
import { HttpClient } from "../../spa/service/HttpClient.js";
import { Observable } from "../../spa/utils/Observable.js";
import { PopService } from "./Pop.service.js";
import { UserService } from "./User.service.js";

export class FriendsService extends AInjectable {
	searchList = null;
	renderSearchBool = new Observable();
	friendsList = null;
	renderFriendsListBool = new Observable();

	searchUser(searchString) {
		injector[HttpClient].post("searchUser/", {
			search_string: searchString,
		}, true).then(response => {
			injector[UserService].isOnline = true;
			if (response.ok) {
				this.searchList = response.users;
				this.renderSearchBool.next(response.users);
				this.searchList = null;
			}
		}).catch(error => {
			if (error instanceof TokenError) {
				injector[UserService].logoutManager("/auth", false, "pop.reconnect");
			}
		});
	}

	addFriend(newFriendUsername) {
		injector[HttpClient].post("addFriend/", {
			username: newFriendUsername,
		}, true).then(response => {
			injector[UserService].isOnline = true;
			if (response.ok) {
				injector[PopService].renderPop(true, "pop.friendSuccess");
				this.getFriendsList();
			} else {
				injector[PopService].renderPop(false, "pop.friendDanger");
			}
		}).catch(error => {
			if (error instanceof TokenError) {
				injector[UserService].logoutManager("/auth", false, "pop.reconnect");
			}
		});
	}

	removeFriend(friendUsername) {
		injector[HttpClient].delete("removeFriend/", {
			username: friendUsername
		}, true).then(response => {
			if (response.ok) {
				injector[PopService].renderPop(true, "pop.deleteFriendSuccess");
				this.getFriendsList();
			} else {
				injector[PopService].renderPop(false, "pop.deleteFriendDanger");
			}
		}).catch(error => {
			if (error instanceof TokenError) {
				injector[UserService].logoutManager("/auth", false, "pop.reconnect");
			}
		});
	}

	getFriendsList() {
		injector[HttpClient].get("getFriendsList/", {}, true).then(response => {
			injector[UserService].isOnline = true;
			if (response.ok) {
				this.friendsList = response.friends;
				this.renderFriendsListBool.next(response.friends);
			} else {
				this.friendsList = {};
				this.renderFriendsListBool.next(false);
			}
		}).catch(error => {
			if (error instanceof TokenError) {
				injector[UserService].logoutManager("/auth", false, "pop.reconnect");
			}
		});
	}
}