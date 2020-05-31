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



// Register the service worker that caches our files.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('service-worker.js')
    .then(() => {
      console.log('Service worker registered');
    })
    .catch(err => {
      console.log('Service worker registration failed: ' + err);
    });
}