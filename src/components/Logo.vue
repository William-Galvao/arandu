<script setup>

defineProps({
    invert: Boolean
})

</script>

<template>
    <a href="/">
        <div class="flex items-center gap-x-1">
            <fa icon="leaf" class="text-4xl" :class="invert ? 'text-white' : 'text-green-600'" />
            <span class="font-semibold text-2xl" :class="invert ? 'text-white' : 'text-green-600'">Arandu</span>
        </div>
    </a>
</template>