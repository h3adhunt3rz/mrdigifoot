/* =========================================================
   MRDIGIFOOT · Configuration Supabase (côté client uniquement)
   URL + clé anon sont PUBLIQUES (conçues pour être exposées au
   navigateur). La clé service_role est SECRÈTE : elle ne vit que
   dans server.py et ne doit jamais être placée ici.
   Ce fichier est chargé par :
     - la webapp  (index.html racine → /supabase-config.js)
     - le site    (mrdigifoot_github/predictions/index.html → ../supabase-config.js)
   ========================================================= */
window.MRDIGIFOOT_SUPABASE = {
  url: "https://ijvsnxpzvxithsyqoluw.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqdnNueHB6dnhpdGhzeXFvbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0OTA1OTksImV4cCI6MjEwMzA2NjU5OX0.DvYijydndGIy8qWT1dnGK8aVYkYHIjVyCWMTKvPq_0M"
};

/* Clé publique Cloudflare Turnstile (captcha invisible anti-bot) */
window.TURNSTILE_SITE_KEY = "0x4AAAAAAEi0sOaBYZIsnA4o";