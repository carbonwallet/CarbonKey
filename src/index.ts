import '../css/bootstrap.min.css'
import '../css/style.css'
import '../node_modules/node-snackbar/dist/snackbar.css'
import { Application } from "stimulus"
import NavigationController from "./controllers/navigation_controller"
import BackupController from "./controllers/backup_controller"
import RestoreController from "./controllers/restore_controller"
import ScannerController from "./controllers/scanner_controller"

const application = Application.start()

application.register("navigation", NavigationController)
application.register("backup", BackupController)
application.register("restore", RestoreController)
application.register("scanner", ScannerController)