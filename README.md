<h1 align="center">Vue Click Outside Directive</h1>

[![npm version](https://img.shields.io/npm/v/vue-click-outside-next.svg)](https://www.npmjs.com/package/vue-click-outside-next)
[![npm downloads](https://img.shields.io/npm/dm/vue-click-outside-next.svg)](https://www.npmjs.com/package/vue-click-outside-next)
[![license](https://img.shields.io/npm/l/vue-click-outside-next.svg)](https://github.com/7Hunter7/vue-click-outside/blob/master/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Vue 2 & 3](https://img.shields.io/badge/Vue-2.x%20%7C%203.x-brightgreen)](https://vuejs.org/)
[![GitHub stars](https://img.shields.io/github/stars/7Hunter7/vue-click-outside?style=social)](https://github.com/7Hunter7/vue-click-outside)

> Профессиональная директива для отслеживания кликов вне элемента. Оптимизированная, с TypeScript, без зависимостей.

## Автор
Ivan Kalugin  

[![Telegram](https://img.shields.io/badge/-telegram-red?color=white&logo=telegram&logoColor=black)](https://t.me/Ivan_Anatolievich_Kalugin)

## ✨ Особенности

- 🚀 **Оптимизированная** - requestAnimationFrame, debounce, группировка событий
- 📦 **Zero dependencies** - ничего лишнего
- 🌍 **TypeScript** - полная типизация
- 📱 **Мобильные устройства** - поддержка touch событий
- 🎯 **Middleware** - гибкая фильтрация
- 🪟 **Для модалок** - специальная директива с Intersection Observer
- 🔧 **Глобальное API** - добавление игнорируемых селекторов

## 📦 Установка

```bash
npm install vue-click-outside
# или
yarn add vue-click-outside
```

## 🔧 Подключение для Vue 2/3:

### Для Vue 2
```javascript
import Vue from 'vue'
import ClickOutside from 'vue-click-outside'
Vue.use(ClickOutside)
```

### Для Vue 3
```javascript
import { createApp } from 'vue'
import App from './App.vue'
import ClickOutside from 'vue-click-outside'

const app = createApp(App)
app.use(ClickOutside)
app.mount('#app')
```

## 🚀 Быстрый старт

```javascript
// main.js
import Vue from "vue";
import ClickOutside from "vue-click-outside";

Vue.use(ClickOutside);

// В компоненте
export default {
  methods: {
    handleClickOutside() {
      console.log("Клик вне элемента!");
    },
  },
};
```

```vue
<template>
  <div class="dropdown" v-click-outside="handleClickOutside">Мой дропдаун</div>
</template>
```

## 📚 API Reference

### Директивы

| Директива               | Описание           |
| ----------------------- | ------------------ |
| `v-click-outside`       | Базовая директива  |
| `v-modal-click-outside` | Для модальных окон |

### Конфигурация

```javascript
v-click-outside="{
  handler: onClickOutside,  // обязательный
  middleware: (target) => !target.closest('.ignore'), // опционально
  capture: false, // опционально
  passive: true   // опционально
}"
```

### Модификаторы

| Модификатор | Описание                       |
| ----------- | ------------------------------ |
| `.capture`  | Использовать capture фазу      |
| `.passive`  | Использовать passive слушатель |

## 🎯 Примеры

### С middleware

```vue
<template>
  <div
    v-click-outside="{
      handler: closeDropdown,
      middleware: (target) => !target.closest('.keep-open'),
    }"
  >
    <div class="keep-open">Этот элемент не закрывает дропдаун</div>
  </div>
</template>
```

### Для модального окна

```vue
<template>
  <div class="modal" v-modal-click-outside="closeModal">Модальное окно</div>
</template>
```

### Глобальное API

```javascript
// Добавить игнорируемый селектор глобально
this.$clickOutside.addIgnoredSelector(".datepicker-popup");

// Удалить игнорируемый селектор
this.$clickOutside.removeIgnoredSelector(".datepicker-popup");
```

## 📊 Производительность

| Метрика       | Значение              |
| ------------- | --------------------- |
| Размер        | ~2KB gzipped          |
| Зависимости   | 0                     |
| Совместимость | Vue 2/3, все браузеры |

## Тестирование `clickOutside.test.js`
1. **Базовые тесты** - клик внутри/снаружи
2. **Тест middleware** - middleware
3. **Тест производительности** - производительность
4. **Тест XSS** - безопасность

## 📄 Лицензия

MIT © [Ivan Kalugin](https://github.com/7Hunter7)
