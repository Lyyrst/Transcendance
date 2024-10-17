import { injector } from "../Bootstrap.js";
import { AInjectable } from "./AInjectable.js";
import { HttpClient } from "./HttpClient.js";
import { TokenError} from "../error/TokenError.js"

export class TokenService extends AInjectable {
	constructor() {
		super();
	}

	getCookie(name) {
		const value = `; ${document.cookie}`;
		const parts = value.split(`; ${name}=`);
		if (parts.length === 2) return parts.pop().split(';').shift();
	}

	deleteCookie() {
		document.cookie = 'accessToken=; Max-Age=0; path=/; SameSite=Lax;';
		document.cookie = 'refreshToken=; Max-Age=0; path=/; SameSite=Lax;';
	}

	async getRefreshedToken() {
		const refreshToken = this.getCookie('refreshToken');
	
		if (!refreshToken) {
			throw new TokenError(`Erreur Token: no refresh token`);
		}
		let response = await fetch('https:8433//localhost/api/token/refresh/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ refresh: refreshToken }),
			credentials: 'include',
		});

		if (!response.ok) {
			throw new TokenError(`Erreur Token: failed to refresh token`);
		}
		response = await injector[HttpClient].responseDecoder(response);
		if (response.access) {
			return response.access;
		} else {
			throw new TokenError(`Erreur Token: no refresh token in response`);
		}
	}

	async refreshToken() {
		try {
			const accessToken = await this.getRefreshedToken();
			this.setCookie(`accessToken`, accessToken, 1);
		} catch (error) {
			throw error;
		}
	}

}