import { AComponent } from "../../../spa/component/AComponent.js"
import { ReplayObservable } from "../../../spa/utils/ReplayObservable.js";

export class BackgroundComponent extends AComponent {
    videoSpeed = new ReplayObservable();

    onInit() {
        super.onInit();
        this.generateHtml({});

        this.videoSpeed.next(0.75);
        this.videoSpeed.subscribe((value) => {
            if (document.querySelector(this.getSelector() + " video")) {
                document.querySelector(this.getSelector() + " video").playbackRate = value
            }
        });

        return true;
    }

    getCSSPath() {
        return "app/component/Background/Background.component.css";
    }

    render() {
        super.render();
        document.querySelector(this.getSelector() + " video").playbackRate = 0.75;
    }

    generateHtml(config) {
        this.html = `
        <video id="video" autoplay muted loop class="backgroundVideo">
        	<source src="app/assets/vid/neonVideo2.mp4" type="video/mp4">
    	</video>
        `
    }
}
