<script setup lang="ts">
import { ref, inject } from 'vue';
import { MenuModel } from '../models/menu';
import { TimeslotModel } from '../models/timeslot';
import type { Vendor } from '../models/vendor';
import type { Product } from '../models/menu';
import type { TimeslotResponse, TimeslotRequest } from '../models/timeslot';
import type { DayManager } from '../models/DayManager';
import { dayManagerKey } from '../models/injectionKeys';

interface DishData {
  vendor: Vendor;
  dish: Product;
}

const props = defineProps<{
  // `null` until the parent finishes its async fetch — the prop is never
  // an error, just an empty set of vendors during that window.
  vendors: Vendor[] | null;
}>();

const emit = defineEmits(['close']);

// State
const isSpinning = ref(false);
const currentSpinningDish = ref<DishData | null>(null);
const selectedDish = ref<DishData | null>(null);
const loadedImages = new Map<string, HTMLImageElement>();

// Canvas elements
const vendorCanvasRef = ref<HTMLCanvasElement | null>(null);
const dishCanvasRef = ref<HTMLCanvasElement | null>(null);
const resultVendorCanvasRef = ref<HTMLCanvasElement | null>(null);
const resultDishCanvasRef = ref<HTMLCanvasElement | null>(null);
const displayedTimeslots = ref<Timeslot[]>([]);

// Format a timestamp into HH:mm
const formatTime = (date: number) =>
  new Intl.DateTimeFormat('da-dk', { hour: 'numeric', minute: 'numeric' }).format(new Date(date));

// Preload images
const preloadImages = async (dishes: DishData[]) => {
  const promises = dishes.map((dishData) => {
    return new Promise<void>((resolve) => {
      let loadedCount = 0;
      const totalImages = 2;

      const checkComplete = () => {
        loadedCount++;
        if (loadedCount >= totalImages) {
          resolve();
        }
      };

      // Preload vendor image
      if (dishData.vendor.imageUrl && !loadedImages.has(dishData.vendor.imageUrl)) {
        const vendorImg = new Image();
        vendorImg.crossOrigin = 'anonymous';
        vendorImg.onload = () => {
          loadedImages.set(dishData.vendor.imageUrl, vendorImg);
          checkComplete();
        };
        vendorImg.onerror = () => checkComplete();
        vendorImg.src = dishData.vendor.imageUrl;
      } else {
        checkComplete();
      }

      // Preload dish image
      if (dishData.dish.ImageUrl && !loadedImages.has(dishData.dish.ImageUrl)) {
        const dishImg = new Image();
        dishImg.crossOrigin = 'anonymous';
        dishImg.onload = () => {
          loadedImages.set(dishData.dish.ImageUrl, dishImg);
          checkComplete();
        };
        dishImg.onerror = () => checkComplete();
        dishImg.src = dishData.dish.ImageUrl;
      } else {
        checkComplete();
      }
    });
  });

  await Promise.all(promises);
};

// Helper to draw to canvas
const drawToCanvas = (canvas: HTMLCanvasElement, imageUrl: string, width: number, height: number, fallbackColor = '#ddd') => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);

  if (loadedImages.has(imageUrl)) {
    const img = loadedImages.get(imageUrl)!;
    // Draw image with object-fit: cover logic
    const imgRatio = img.width / img.height;
    const canvasRatio = width / height;
    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgRatio > canvasRatio) {
      drawHeight = height;
      drawWidth = height * imgRatio;
      offsetX = -(drawWidth - width) / 2;
      offsetY = 0;
    } else {
      drawWidth = width;
      drawHeight = width / imgRatio;
      offsetX = 0;
      offsetY = -(drawHeight - height) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  } else {
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No image', width / 2, height / 2);
  }
};

// Get all available dishes by fetching each vendor's menu
const getAllDishes = async (): Promise<DishData[]> => {
  const allDishes: DishData[] = [];
  // Guard against vendors being null/empty (parent's fetch may still be in
  // flight when the button is clicked).
  if (!props.vendors || props.vendors.length === 0) return allDishes;

  for (const vendor of props.vendors) {
    // Only include visible vendors (matches vanilla JS behavior)
    if (!vendor.visible) continue;

    try {
      const categories = await MenuModel.fetchMenu(vendor.routeName);
      for (const category of categories) {
        const items = category.items ?? [];
        for (const item of items) {
          // Skip disabled items
          if (item.enabled === false) continue;

          allDishes.push({
            vendor,
            dish: item
          });
        }
      }
    } catch (error) {
      console.error(`Failed to fetch menu for vendor ${vendor.routeName}`, error);
    }
  }
  return allDishes;
};

// Kick off a spin. Synchronous in the template (Vue can't use `await` there)
// but fully async internally — mirrors vanilla JS's `clickHandler`, which
// fetches the available dishes inside the click handler before spinning.
const spin = async () => {
  if (isSpinning.value) return;
  const dishes = await getAllDishes();
  if (!dishes || dishes.length === 0) return;
  isSpinning.value = true;
  await startSpinning(dishes);
};

const startSpinning = async (dishes: DishData[]) => {
  isSpinning.value = true;

  // Preload all images so canvas rendering has no extra network requests
  await preloadImages(dishes);

  const spinDuration = 3000; // ms
  const spinInterval = 100; // ms
  const totalSteps = Math.ceil(spinDuration / spinInterval);
  let currentStep = 0;

  const spinPromise = new Promise<DishData>((resolve) => {
    const intervalId = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * dishes.length);
      updateSpinningDisplay(dishes[randomIndex]);

      currentStep++;
      if (currentStep >= totalSteps) {
        clearInterval(intervalId);
        // Select final dish randomly
        const finalIndex = Math.floor(Math.random() * dishes.length);
        resolve(dishes[finalIndex]);
      }
    }, spinInterval);
  });

  const result = await spinPromise;
  isSpinning.value = false;
  selectedDish.value = result;
  showResult(result);
};

const openModal = () => {
  const dialog = document.querySelector('.random-dish-modal') as HTMLDialogElement | null;
  dialog?.showModal();
};

const closeModal = () => {
  const dialog = document.querySelector('.random-dish-modal') as HTMLDialogElement | null;
  dialog?.close();
  isSpinning.value = false;
  selectedDish.value = null;
  currentSpinningDish.value = null;
};

// Close the nested details dialog without leaving the result view
const closeDishDetails = () => {
  const dialog = document.querySelector('.result-dish-details') as HTMLDialogElement | null;
  dialog?.close();
};

// Update the spinning display to show a dish - no network requests
const updateSpinningDisplay = (dishData: DishData) => {
  currentSpinningDish.value = dishData;

  if (vendorCanvasRef.value) {
    drawToCanvas(vendorCanvasRef.value, dishData.vendor.imageUrl || '', 60, 60, '#ccc');
  }
  if (dishCanvasRef.value) {
    drawToCanvas(dishCanvasRef.value, dishData.dish.ImageUrl || '', 150, 150, '#ddd');
  }
};

// Display the final result (matches vanilla JS showResult)
const showResult = async (selectedDish: DishData) => {
  const { vendor, dish } = selectedDish;

  // Populate the inline result view (vendor + dish + name)
  if (resultVendorCanvasRef.value) {
    drawToCanvas(resultVendorCanvasRef.value, vendor.imageUrl || '', 60, 60, '#ccc');
  }
  if (resultDishCanvasRef.value) {
    drawToCanvas(resultDishCanvasRef.value, dish.ImageUrl || '', 150, 150, '#ddd');
    // Clicking the result dish canvas opens the details dialog
    resultDishCanvasRef.value.addEventListener('click', () => {
      showDishDetails(vendor, dish);
    });
  }

  // Get and display timeslots for the selected dish on the selected day
  await displayTimeslots(selectedDish);
};

// Populate the nested result-details dialog (matches vanilla JS)
const showDishDetails = (vendor: Vendor, dish: Product) => {
  const dialog = document.querySelector('.result-dish-details') as HTMLElement | null;
  if (!dialog) return;

  const resultDetailsName = document.querySelector('.result-details-name') as HTMLElement | null;
  const resultDetailsDescription = document.querySelector('.result-details-description') as HTMLElement | null;
  const resultDetailsCanvas = document.querySelector('.result-details-canvas') as HTMLCanvasElement | null;

  // Populate text fields
  if (resultDetailsName && dish.Name) resultDetailsName.textContent = dish.Name;
  if (resultDetailsDescription && dish.DescriptionLong) resultDetailsDescription.textContent = dish.DescriptionLong;

  // Draw the dish image into the details canvas
  if (resultDetailsCanvas) {
    drawToCanvas(resultDetailsCanvas, dish.ImageUrl || '', 150, 150, '#ddd');
  }

  // Open the nested details dialog
  (dialog as HTMLDialogElement).showModal();
};

// Fetch and render timeslots for the selected dish on the selected day
const displayTimeslots = async (selectedDish: DishData) => {
  const dayManager = inject<DayManager>(dayManagerKey);
  const selectedDay = dayManager?.selectedDay.value ?? null;

  const request: TimeslotRequest = {
    routeName: selectedDish.vendor.routeName,
    products: [{
      bongCategoryId: 0,
      quantity: 1,
      productId: selectedDish.dish.key || selectedDish.dish.Name,
      productName: selectedDish.dish.Name,
    }],
  };

  try {
    const timeslotsResponse = await TimeslotModel.fetchTimeslots(request);
    if (selectedDay) {
      const day = timeslotsResponse.find(t => t.label === selectedDay);
      if (day?.timeslots) {
        day.timeslots.sort((a, b) => a.date - b.date);
        displayedTimeslots.value = day.timeslots;
      } else {
        displayedTimeslots.value = [];
      }
    } else {
      displayedTimeslots.value = [];
    }
  } catch (error) {
    console.error('Failed to fetch timeslots', error);
    displayedTimeslots.value = [];
  }
};

</script>

<template>
  <div class="random-dish-container">
    <button @click="openModal" class="random-dish-btn">🎲 Can't decide? Let me help you choose!</button>

    <dialog class="random-dish-modal" @click.self="closeModal">
      <div class="random-dish-content">
        <h2 v-if="!isSpinning && !selectedDish">🎲 What Should I Eat?</h2>

        <!-- Spinning State -->
        <div v-if="isSpinning" class="spinning-container">
          <div class="spinning-dish">
            <canvas 
              ref="vendorCanvasRef" 
              width="60" 
              height="60" 
              class="spinning-vendor-canvas"
            ></canvas>
            <h3 class="spinning-dish-name">{{ currentSpinningDish?.dish.Name || 'Selecting...' }}</h3>
            <canvas 
              ref="dishCanvasRef" 
              width="150" 
              height="150" 
              class="spinning-dish-canvas"
            ></canvas>
          </div>
          <button @click="isSpinning = false; closeModal()" class="close-btn">Close</button>
        </div>

        <!-- Result State -->
        <div v-else-if="selectedDish" class="result-container">
          <div class="result-dish">
            <h3>🍽️ Perfect! Here's your suggestion:</h3>
            <div class="result-vendor">
              <canvas 
                ref="resultVendorCanvasRef" 
                width="60" 
                height="60" 
                class="result-vendor-canvas"
              ></canvas>
              <span class="result-vendor-name">{{ selectedDish.vendor.name }}</span>
            </div>
            <h4 class="result-dish-name">{{ selectedDish.dish.Name }}</h4>
            <p class="result-description">{{ selectedDish.dish.DescriptionLong }}</p>
            <canvas 
              ref="resultDishCanvasRef" 
              width="150" 
              height="150" 
              class="result-dish-canvas"
              @click="showDishDetails(selectedDish.vendor, selectedDish.dish)"
            ></canvas>
            
            <!-- Nested details dialog (matches vanilla JS result-dish-details) -->
            <dialog class="result-dish-details">
              <h1 class="result-details-name">{{ selectedDish.dish.Name }}</h1>
              <canvas 
                class="result-details-canvas"
              ></canvas>
              <br>
              <p class="result-details-description"></p>
              <button autofocus @click="closeDishDetails">Close</button>
            </dialog>
            
            <div class="result-timeslots">
              <h4>⏰ Available today:</h4>
              <div class="result-timeslots-list">
                <span v-if="displayedTimeslots.length === 0">No times available...</span>
                <span v-for="ts in displayedTimeslots" :key="ts.date"
                      :class="ts.enabled ? 'enabled timeslot' : 'disabled timeslot'">
                  {{ formatTime(ts.date) }}
                </span>
              </div>
            </div>
          </div>
          <button @click="closeModal" class="close-btn">Close</button>
        </div>

        <!-- Ready State -->
        <div v-else class="ready-container">
          <button @click="spin" class="spin-btn">🎲 Surprise Me!</button>
          <button @click="closeModal" class="close-btn">Close</button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
/* Styles ported from front-end/styles.css */
.random-dish-btn {
  background-color: var(--primary-color, #1670d6);
  color: white;
  border: none;
  padding: 0.5em 1em;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.3s ease;
  margin-bottom: 1em;
}

.random-dish-btn:hover {
  background-color: #1456b8;
}

.random-dish-modal {
  border: none;
  border-radius: 15px;
  padding: 0;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.random-dish-modal::backdrop {
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
}

.random-dish-content {
  padding: 2em;
  text-align: center;
  background-color: var(--bg-color, #f9f9f9);
  border-radius: 15px;
}

.spinning-container {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.spinning-dish {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1em;
}

.spinning-vendor-canvas {
  border-radius: 10px;
  object-fit: contain;
}

.spinning-dish-canvas {
  border-radius: 15px;
  object-fit: cover;
}

.spinning-dish-name {
  font-size: 1.2em;
  margin: 0;
}

.result-container {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-dish {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1em;
}

.result-vendor {
  display: flex;
  align-items: center;
  gap: 0.5em;
  background-color: var(--accent-color, #dee5f2);
  padding: 0.5em 1em;
  border-radius: 10px;
}

.result-vendor-name {
  font-weight: bold;
}

.result-dish-name {
  font-size: 1.3em;
  margin: 0.5em 0;
  color: var(--primary-color, #1670d6);
}

.result-description {
  margin: 0 0 0.5em;
  max-width: 400px;
  color: #333;
}

.result-dish-details {
  background-color: var(--bg-color, #f9f9f9);
  border-radius: 15px;
  padding: 1.5em;
  max-width: 400px;
  width: 90%;
}

.result-dish-details::backdrop {
  background-color: rgba(0, 0, 0, 0.4);
}

.result-details-name {
  margin: 0 0 0.75em;
  color: var(--primary-color, #1670d6);
}

.result-details-canvas {
  border-radius: 15px;
}

.result-details-description {
  margin: 0.75em 0 1.5em;
  max-width: 400px;
  color: #333;
}

.result-vendor-canvas {
  border-radius: 10px;
}

.result-dish-canvas {
  border-radius: 15px;
  cursor: pointer;
}

.result-timeslots {
  margin-top: 1em;
}

.result-timeslots-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5em;
  justify-content: center;
}

.spin-btn {
  background-color: var(--enabled-color, #197d07);
  color: white;
  border: none;
  padding: 0.75em 1.5em;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
}

.close-btn {
  background-color: var(--secondary-color, #1a1b1d);
  color: white;
  border: none;
  padding: 0.75em 1.5em;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 1em;
}

.ready-container {
  display: flex;
  flex-direction: column;
  gap: 1em;
}
</style>
