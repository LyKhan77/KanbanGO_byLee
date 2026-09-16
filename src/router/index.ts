import { createRouter, createWebHistory } from 'vue-router';
import BoardListView from '../views/BoardListView.vue';
import BoardView from '../views/BoardView.vue';
import BoardListBanner from '../components/BoardListBanner.vue';
import BoardBanner from '../components/BoardBanner.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'boards', components: { default: BoardListView, banner: BoardListBanner } },
    { path: '/board/:boardId', name: 'board', components: { default: BoardView, banner: BoardBanner } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

export default router;
