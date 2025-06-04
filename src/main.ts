import { createApp } from "vue";
import App from "./App.vue";
import "./index.css";
import { setupSystem } from "./system";
import { setupPinia } from "./store";
import { setupRouter } from "./router";

function boostrap() {
  setupSystem();
  const app = createApp(App);
  setupPinia(app);
  setupRouter(app);
  app.mount("#app");
}

boostrap();
