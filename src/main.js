import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

import router from "@/routes";

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';


library.add(fas);
library.add(fab);

createApp(App)
    .use(router)
    .component('fa', FontAwesomeIcon)
    .mount('#app')
