<script setup>
import Navbar from '../components/Navbar.vue'
import LoadingSpin from '../components/LoadingSpin.vue';
import { auth, db, storage } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { ref as fireRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { ref, computed, reactive, watch } from 'vue';
import {useToast} from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-sugar.css';

// Recebe os dados cadastrados na coleção 'users' a partir da função getUser.
const user = ref({})

const loading = ref(false)
const posts = ref([])
const text = ref("")
const image = ref(null)
const urlImage = ref("")
const disablePost = ref(false)
const $toast = useToast();

// Observa o state 'image', sempre que uma imagem é enviada o botão de publicar fica desabilitado até que o upload esteja completo.
watch(() => image.value,
    () => { disablePost.value = true })

// Verifica a propriedade MEMBER do state user.
const isMember = computed(() => {
    return user.value.MEMBER
})

// Ordena os posts do mais recente para o mais antigo.
const sortPostsByDate = computed(() => {
    return posts.value.sort((a, b) => new Date(b.WHEN) - new Date(a.WHEN))
})

const comment = sortPostsByDate && reactive(Array(sortPostsByDate.value.length).fill(''))
const commentsVisible = sortPostsByDate && reactive(Array(sortPostsByDate.value.length).fill(false))

function toggleVisibility(index) {
    commentsVisible[index] = !commentsVisible[index];
}

// Busca os dados do usuário logado na coleção 'users'.
// Se não existir, cria um usuário com a propriedade MEMBRO falsa.
async function getUser() {
    loading.value = true
    const docRef = doc(db, "users", auth.currentUser.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        user.value = docSnap.data()
        loading.value = false
    } else {
        await setDoc(doc(db, "users", auth.currentUser.uid), {
            NAME: auth.currentUser.displayName,
            EMAIL: auth.currentUser.email,
            PHOTOURL: auth.currentUser.photoURL,
            MEMBER: false
        });
        loading.value = false
    }
}

getUser()

// Busca todos os documentos da coleção posts.
async function getAllPosts() {
    const querySnapshot = await getDocs(collection(db, "posts"));
    querySnapshot.forEach(async (doc) => {
        // Aqui eu crio um novo objeto com os mesmo dados que recebo - SPREAD OPERATOR.
        const fetchedData = { ...doc.data() }
        // Neste novo objeto eu substituo o formato da data e do autor e incluo o id do documento.
        fetchedData.WHEN = (new Date(fetchedData.WHEN.seconds * 1000)).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
        fetchedData.AUTHOR = await getName(fetchedData.AUTHOR)
        fetchedData.ID = doc.id
        // Coloco cada objeto formatado dentro do state posts.
        posts.value.push(fetchedData)
    });
}



// Aqui eu retorno o nome do usuário que está cadastrado na coleção de users.
async function getName(id) {
    const docRef = doc(db, "users", id);
    const docSnap = await getDoc(docRef);
    return docSnap.data().NAME
}


getAllPosts()

// Contagem do tamanho do array de reacts.
function countReacts(arr) {
    return arr.length
}

async function postNewPost() {
    if (!text.value) {
        $toast.error('Não é possível publicar um texto vazio.')
        return
    }

    if (image) {
        uploadImage
    }

    loading.value = true

    const post = {
        AUTHOR: auth.currentUser.uid,
        REACTS: {
            FUNNY: [],
            LOVELY: [],
            SAD: []
        },
        COMMENTS: [],
        TEXT: text.value,
        WHEN: Timestamp.fromDate(new Date()),
        IMAGE: urlImage.value && urlImage.value

    }
    const docRef = await addDoc(collection(db, "posts"), post)
    loading.value = false
    posts.value = []
    text.value = ""
    urlImage.value = ""
    $toast.success('Post adicionado.')
    getAllPosts()
}

async function updateReacts(id, react) {
    // Copia o objeto REACTS do documento selecionado.
    const objReacts = posts.value.find(post => post.ID == id).REACTS

    if (react == 'FUNNY') {
        // Se o uid do usuário logado consta no array.
        if (objReacts.FUNNY.some(uid => uid == auth.currentUser.uid)) {
            // Acha o index do uid do usuário logado.
            const index = objReacts.FUNNY.indexOf(auth.currentUser.uid)
            // Remove o index encontrado.
            objReacts.FUNNY.splice(index, 1)
        } else {
            objReacts.FUNNY.push(auth.currentUser.uid)
        }
    }
    if (react == 'SAD') {
        if (objReacts.SAD.some(uid => uid == auth.currentUser.uid)) {
            const index = objReacts.SAD.indexOf(auth.currentUser.uid)
            objReacts.SAD.splice(index, 1)
        } else {
            objReacts.SAD.push(auth.currentUser.uid)
        }
    }
    if (react == 'LOVELY') {
        if (objReacts.LOVELY.some(uid => uid == auth.currentUser.uid)) {
            const index = objReacts.LOVELY.indexOf(auth.currentUser.uid)
            objReacts.LOVELY.splice(index, 1)
        } else {
            objReacts.LOVELY.push(auth.currentUser.uid)
        }
    }

    const postRef = doc(db, 'posts', id)
    await updateDoc(postRef, {
        REACTS: objReacts
    });

}

async function deletePost(id) {
    loading.value = true
    await deleteDoc(doc(db, "posts", id));
    posts.value = []
    getAllPosts()
    loading.value = false
    $toast.success('Post excluído.')
}

async function postComment(id, index) {

    if (!comment[index]) {
        $toast.error('Não é possível publicar um comentário vazio.')
        return
    }

    const objComments = posts.value.find(post => post.ID == id).COMMENTS

    const newComment = {
        TEXT: comment[index],
        AUTHOR: auth.currentUser.displayName
    }
    objComments.push(newComment)

    const postRef = doc(db, 'posts', id)
    await updateDoc(postRef, {
        COMMENTS: objComments
    });
    comment[index] = ""
    commentsVisible[index] = true
    $toast.success('Comentário adicionado.')
}

async function deleteComment(id, index) {
    const objComments = posts.value.find(post => post.ID == id).COMMENTS
    objComments.splice(index, 1)
    const postRef = doc(db, 'posts', id)
    await updateDoc(postRef, {
        COMMENTS: objComments
    });
    $toast.success('Comentário excluído.')
}

async function uploadImage(e) {
    const timestamp = new Date().toISOString()
    image.value = e.target.files[0];
    if (!image.value.type.match('image.*')) {
        return alert('Only JPG and PNG files are allowed!');
    }
    const storageRef = fireRef(storage, `images/${timestamp}-${image.value.name}`)
    await uploadBytes(storageRef, image.value).then(async (snapshot) => {
        urlImage.value = await getDownloadURL(snapshot.ref)
        image.value = null;
        $toast.success('Imagem carregada.')
    })
    disablePost.value = false;
}

</script>

<template>
    <Navbar :name="user.NAME" :photo="user.PHOTOURL" />

    <div v-if="loading" class="h-screen flex justify-center items-center">
        <LoadingSpin />
    </div>

    <div v-if="!loading">
        <!-- Mensagem ao usuário que não é MEMBRO -->
        <div v-if="!isMember" class="flex justify-center my-8">
            <div class="flex flex-col p-4 text-white bg-green-600 text-center w-fit rounded-lg">
                <span class="text-2xl font-bold">A sua conta Google não tem a permissão necessária para acessar esta
                    página.</span>
                <span class="text-lg font-semibold">Por favor, entre em contato com o administrador do sistema.</span>

            </div>
        </div>
        <!-- Mensagem ao usuário que não é MEMBRO -->

        <!-- Área de postagem -->
        <div v-if="isMember" class="py-8 px-4 flex flex-col justify-center items-center gap-y-4 animate__animated animate__fadeIn">

            <input @change="uploadImage" accept=".jpg,.png" type="file"
                class="file:bg-green-600 file:text-white file:rounded-lg file:border-none file:shadow-lg file:cursor-pointer w-full sm:w-1/2" />
            <textarea v-model="text" placeholder="O que você gostaria de contar?"
                class="resize-none w-full sm:w-1/2 p-2 border-2 border-green-600 rounded-lg" />
            <div class="w-full sm:w-1/2 flex items-center justify-end">
                <button @click="postNewPost" :disable="disablePost"
                    class="text-white bg-green-600 rounded-lg px-2 py-1 font-semibold hover:scale-105"
                    :class="disablePost&& 'bg-gray-300 text-black'">
                    Publicar
                </button>
            </div>
        </div>
        <!-- Área de postagem -->

        <!-- Área de exibição dos posts -->
        <div v-if="isMember && !loading" class="flex flex-col py-8 px-4 justify-center items-center gap-y-12 w-full">
            <template v-for="post, index in sortPostsByDate">
                <div class="flex flex-col justify-center items-center gap-y-2 w-full sm:w-1/2">
                    <img v-if="post.IMAGE" :src="post.IMAGE" class="w-full border-2 border-green-600 rounded-lg" />
                    <span class="p-2 border-2 bg-green-100 border-green-600 rounded-lg w-full">{{ post.TEXT }}</span>
                    <div class="flex items-center justify-between w-full text-xs">
                        <span @click="deletePost(post.ID)" v-if="auth.currentUser.displayName == post.AUTHOR"
                            class="text-red-500 underline hover:cursor-pointer">Remover publicação</span>
                        <span class="self-end">Criado por <span class="text-green-600 font-bold">{{ post.AUTHOR }}</span> em {{ post.WHEN }}</span>
                    </div>
                    <div class="text-sm self-end flex gap-x-2">
                        <div @click="updateReacts(post.ID, 'FUNNY')"
                            class="flex items-center gap-x-1 border-2 rounded-full p-1 text-white border-yellow-400 bg-yellow-400 hover:cursor-pointer">
                            <fa icon="face-laugh" />
                            <span>{{ countReacts(post.REACTS.FUNNY) }}</span>
                        </div>
                        <div @click="updateReacts(post.ID, 'SAD')"
                            class="flex items-center gap-x-1 border-2 rounded-full p-1 text-white border-purple-400 bg-purple-400 hover:cursor-pointer">
                            <fa icon="face-sad-cry" />
                            <span>{{ countReacts(post.REACTS.SAD) }}</span>
                        </div>
                        <div @click="updateReacts(post.ID, 'LOVELY')"
                            class="flex items-center gap-x-1 border-2 rounded-full p-1 text-white border-red-400 bg-red-400 hover:cursor-pointer">
                            <fa icon="heart" />
                            <span>{{ countReacts(post.REACTS.LOVELY) }}</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-between w-full text-xs">
                        <span class="flex items-center gap-x-1">Comentários [<span>{{ post.COMMENTS.length }}</span>]</span>
                        <span v-if="!commentsVisible[index]" @click="toggleVisibility(index)"
                            class="flex items-center gap-x-1 hover:cursor-pointer">Exibir
                            <fa icon="caret-down" />
                        </span>
                        <span v-if="commentsVisible[index]" @click="toggleVisibility(index)"
                            class="flex items-center gap-x-1 hover:cursor-pointer">Ocultar
                            <fa icon="caret-up" />
                        </span>
                    </div>
                    <div class="flex flex-col w-full" v-if="commentsVisible[index]">
                        <template v-for="comment, index in post.COMMENTS">
                            <div class="flex flex-col w-full my-2">
                                <span class="bg-green-50 p-1"> {{ comment.TEXT }}</span>
                                <div class="flex items-center justify-between text-xs">
                                    <span v-if="auth.currentUser.displayName == comment.AUTHOR"
                                        @click="deleteComment(post.ID, index)"
                                        class="text-red-500 underline hover:cursor-pointer">Remover comentário</span>
                                    <span class="text-xs self-end"> {{ comment.AUTHOR }}</span>
                                </div>
                            </div>
                        </template>
                    </div>
                    <div class="flex items-center w-full">
                        <input class="w-full border-y-4 border-l-4 p-1 border-green-600" v-model="comment[index]" />
                        <button @click="postComment(post.ID, index)"
                            class="p-2 text-white bg-green-600 font-semibold rounded-r-full">Comentar</button>
                    </div>
                </div>
            </template>
        </div>
        <!-- Área de exibição dos posts -->
    </div>
</template>