import { createRouter, createWebHistory } from "vue-router"
const Home = () => import('../views/Home.vue')
const About = () => import('../views/About.vue')
const NotFound = () => import('../views/NotFound.vue')

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/about',
        name: 'About',
        component: About
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: NotFound
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
});

/*router.beforeEach((to, from, next) => {
    AOS.init();
    window.scrollTo(0, 0);
    next();
});*/

export default router;