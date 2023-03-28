<script setup>
import Logo from '../components/Logo.vue'
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import router from '../routes/index'

async function googleLogout() {
    signOut(auth).then(() => {
        router.push('/login')
    }).catch((error) => {

    });
}

defineProps({
    name: String,
    photo: String
})

</script>

<template>
    <nav class="flex items-center justify-between px-2 bg-green-600 py-2">
        <Logo invert class="animate__animated animate__fadeInLeft"/>
        <div class="flex items-center gap-x-4 animate__animated animate__fadeInRight">
            <div class="flex items-center gap-x-2">
                <img :src="photo" referrerpolicy="no-referrer" class="w-10 rounded-full border-2 border-white" />
                <span class="text-white text-sm font-semibold hidden sm:block"> {{ name }}</span>
            </div>
            <button @click="googleLogout" class="rounded-lg px-2 py-1 bg-white text-green-600 font-semibold flex items-center gap-x-1 hover:scale-105">
                <fa icon="door-open" class="p-1 sm:p-0"/>
                <span class="hidden sm:block">Sair</span>
            </button>
        </div>
    </nav>
</template>