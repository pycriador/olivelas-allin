// Service Worker com suporte a Web Share Target API v2
const CACHE_NAME = "wpp-analyzer-v1";
const DB_NAME = "wpp_share_target_db";
const STORE_NAME = "shared_items";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveSharedItem(imageBlob, text) {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put({ image: imageBlob, text: text || "", timestamp: Date.now() }, "latest");
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("Erro ao salvar item compartilhado:", err);
  }
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Intercepta o compartilhamento do WhatsApp/Android
  if (event.request.method === "POST" && url.pathname === "/share-target") {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const image = formData.get("image");
          const text = formData.get("text") || formData.get("title") || "";

          if (image) {
            await saveSharedItem(image, text);
          }

          return Response.redirect("/?shared=1", 303);
        } catch (err) {
          console.error("Falha ao processar compartilhamento:", err);
          return Response.redirect("/", 303);
        }
      })()
    );
    return;
  }
});
