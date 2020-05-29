import '../css/bootstrap.min.css'
import '../css/style.css'
import { Application } from "stimulus"
import NavigationController from "./controllers/navigation_controller"

const application = Application.start()

application.register("navigation", NavigationController)

document.getElementsByTagName('h1')[0].innerHTML = "Hello, TypeScript+webpack World!2";