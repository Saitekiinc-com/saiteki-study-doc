---
layout: home
---

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  if (!import.meta.env.SSR) {
    window.location.pathname = '/saiteki-study-doc/knowledge_base/'
  }
})
</script>

# Redirecting...
