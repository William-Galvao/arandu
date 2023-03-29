<script setup>
import Logo from '../components/Logo.vue';
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from '../firebase';
import router from '../routes/index'
import LoadingSpin from '../components/LoadingSpin.vue';
import { ref } from 'vue';
import { useToast } from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-sugar.css';

const provider = new GoogleAuthProvider();
const loading = ref(false)
const $toast = useToast();

async function googleLogin() {
  loading.value = true
  signInWithPopup(auth, provider)
    .then((result) => {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      router.push('/')
    }).catch((error) => {
      loading.value = false
      const errorCode = error.code;
      const errorMessage = error.message;
      const email = error.customData.email;
      $toast.error(errorMessage)
      const credential = GoogleAuthProvider.credentialFromError(error);
    });

}
</script>

<template>
  <div class="h-screen flex justify-center items-center">
    <div class="flex flex-col items-center gap-y-4 animate__animated animate__fadeIn">
      <Logo />
      <button v-if="!loading" @click="googleLogin"
        class="bg-red-600 rounded-lg flex justify-center items-center gap-x-2 px-2 py-1 font-semibold ring-2 ring-red-400">
        <fa :icon="['fab', 'google']" class="text-white" />
        <span class="text-white">Acesse com Google</span>
      </button>
      <LoadingSpin v-if="loading" />
    </div>
  </div>
</template>