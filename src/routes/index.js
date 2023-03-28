import { createRouter, createWebHistory } from "vue-router";
import { getCurrentUser } from "../firebase";

const routes = [
    {
        path: "/", name: "home", component: () => import("@/views/Home.vue"),
        meta: {
            requiresAuth: true
        }
    },
    { path: "/login", name: "login", component: () => import("@/views/Login.vue") },
];

const router = createRouter({
    routes,
    history: createWebHistory(),
});

router.beforeEach(async (to) => {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    if (requiresAuth && !await getCurrentUser()) {
        return '/login';
    }
})

export default router;