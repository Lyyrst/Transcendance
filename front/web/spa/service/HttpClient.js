import { injector } from "../Bootstrap.js";
import { AInjectable } from "./AInjectable.js";
import { TokenService } from "./Token.service.js";

export class HttpClient extends AInjectable {
	baseUrl = "https://localhost:8443/api";

	constructor() {
		super();
	}

	getUrl(url) {
		return this.baseUrl + "/" + url;
	}

	get(url, options = {}, token = false) {
		return this.fetchAndParseStream(this.getUrl(url), options, token);
	}

	post(url, data, token = false) {
		return this.fetchAndParseStream(this.getUrl(url), {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(data) 
		}, token);
	}

	put(url, data) {
		return this.fetchAndParseStream(this.getUrl(url), {
			method: "PUT",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(data) 
		});
	}

	delete(url, data, token = false) {
		return this.fetchAndParseStream(this.getUrl(url), {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(data) 
		}, token);
	}

	patch(url, data, token = false, isFile = false) {
		if (isFile) {
			return this.fetchAndParseStream(this.getUrl(url), {
				method: "PATCH",
				body: data,
			}, token);
		} else {
			return this.fetchAndParseStream(this.getUrl(url), {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify(data) 
			}, token);
		}
	}

	async fetchAndParseStream(url, options = {}, token = false) {
		if (!token) {
			const response = await fetch(url, options);
			return await this.responseDecoder(response)
		} else {
			let accessToken = injector[TokenService].getCookie('accessToken');
			if (accessToken) {
				options.headers = {
					...options.headers,
					'Authorization': `Bearer ${accessToken}`
				};
			}
			options.credentials = 'include';

			let response = await fetch(url, options);

			if (response.status === 401) {
				try { 
					await injector[TokenService].refreshToken();
					return this.fetchAndParseStream(url, options, true);
				} catch (error) {
					throw error;
				}
			} else {
				response = await this.responseDecoder(response);
				return response;
			}
		}
	}

	async responseDecoder(response) {
		const reader = response.body?.getReader();
		if (!reader) {
			throw new Error('Erreur: La réponse ne contient pas de corps lisible.');
		}

		const decoder = new TextDecoder();
		let data = '';
		let done = false;

		while (!done) {
		const { value, done: doneReading } = await reader.read();
		done = doneReading;
		data += decoder.decode(value, { stream: true });
		}

		return JSON.parse(data);
	}
	
}