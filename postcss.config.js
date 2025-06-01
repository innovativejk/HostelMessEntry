// postcss.config.js
import tailwindcss from '@tailwindcss/postcss'; // <-- यह लाइन बदली गई है
import autoprefixer from 'autoprefixer';

export default {
  plugins: {
    [tailwindcss]: {}, // <-- यह लाइन बदली गई है, अब यह आयातित प्लगइन का उपयोग करती है
    [autoprefixer]: {}, // <-- यह भी स्पष्टता के लिए बदल दिया गया है
  },
};