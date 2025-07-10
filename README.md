
**Penjelasan Komponen:**

* **User Interface:** Titik interaksi utama bagi pengembang (misalnya, ekstensi VS Code, aplikasi web, atau CLI).
* **Agent Core:** Logika inti agen yang mengkoordinasikan semua komponen lainnya, berisi implementasi *agent loop*.
* **Prompt & Memory:** Mengelola input pengguna (prompt) serta menyimpan konteks percakapan saat ini (Short-Term Memory / STM) dan pengetahuan jangka panjang (Long-Term Memory / LTM).
* **Tool / Function Calling Module:** Memungkinkan agen untuk berinteraksi dengan alat eksternal atau memanggil fungsi kustom (misalnya, *code interpreter*, pencari dokumentasi).
* **LLM Integration (OpenAI / Alternatif):** Modul untuk berinteraksi dengan Model Bahasa Besar (LLM) untuk pemrosesan bahasa alami dan pengambilan keputusan.

## Alur Kerja Agent (Observe → Decide → Act)

Agen beroperasi dalam siklus berulang `Observe → Decide → Act` untuk merespons permintaan pengguna.

1.  **Observasi:**
    * Agen menerima *user prompt*.
    * Mengumpulkan semua informasi relevan dari **memori jangka pendek** (riwayat percakapan) dan **memori jangka panjang** (pengetahuan, dokumentasi, pola *coding*).
    * Mempertimbangkan "pemikiran" agen sebelumnya untuk menjaga koherensi.

2.  **Keputusan:**
    * Semua informasi yang terkumpul digabungkan menjadi *prompt* komprehensif, yang kemudian dikirim ke **Model Bahasa Besar (LLM)**.
    * LLM menganalisis *prompt* dan memutuskan langkah terbaik selanjutnya:
        * Memberikan respons langsung.
        * Menggunakan salah satu *tool* yang tersedia untuk mendapatkan informasi lebih lanjut atau melakukan tindakan.

3.  **Tindakan:**
    * Jika LLM memutuskan untuk menggunakan *tool*, agen akan memanggil *tool* yang sesuai dengan argumen yang ditentukan oleh LLM.
    * Hasil dari *tool* kemudian ditambahkan ke memori agen.
    * *Loop* kembali ke fase `Observe` dengan informasi yang diperbarui.
    * Jika LLM memberikan respons akhir, agen akan mengembalikan respons tersebut kepada pengguna dan *loop* berakhir.

## Pendekatan Memori

Agen ini menggunakan kombinasi pendekatan memori:

* **Episodic Memory (STM - Short-Term Memory):**
    * Diimplementasikan dengan menyimpan riwayat percakapan (seperti `shortTermMemory` *array*).
    * Setiap interaksi (pesan pengguna, respons agen, hasil *tool*) ditambahkan ke STM.
    * Bertujuan untuk mempertahankan konteks percakapan saat ini dan merujuk kembali ke interaksi terbaru. Ini adalah bentuk memori yang berfokus pada "apa yang terjadi".

* **Semantic Memory (LTM - Long-Term Memory):**
    * Diimplementasikan secara sederhana sebagai `longTermMemory` *array* dalam `memory.ts` (pencarian *substring* dasar).
    * Dalam implementasi yang lebih canggih, ini akan melibatkan **Embedding** (mengubah teks menjadi representasi vektor) dan **Vector Database** (menyimpan *embedding* untuk pencarian kesamaan semantik).
    * Bentuk memori ini berfokus pada "fakta" dan "pengetahuan umum" yang perlu dipertahankan agen dalam jangka panjang.

**Strategi Penggabungan Memori:** Selama fase **Observasi**, `constructFullPrompt` menggabungkan informasi dari **STM** dan **LTM** yang relevan. Ini memastikan bahwa LLM memiliki akses ke konteks percakapan segera dan pengetahuan yang lebih luas yang relevan dengan kueri pengguna.

## Strategi RAG / Prompt

* **RAG (Retrieval Augmented Generation):**
    * Konsep RAG diterapkan di mana agen "mengambil" informasi yang relevan dari memori jangka panjang (`retrieveFromLTM`) sebelum menghasilkan respons.
    * Ini membantu agen merespons dengan informasi yang lebih akurat dan relevan yang mungkin tidak ada dalam parameter pelatihan awal LLM.

* **Strategi Prompt:**
    * **System Prompt:** Memberikan instruksi umum kepada LLM tentang perannya ("You are a helpful coding assistant...") dan format respons yang diharapkan (respons langsung atau pemanggilan *tool*).
    * **Contextual Prompting:** *User prompt*, riwayat percakapan (`context`), dan informasi LTM yang relevan (`relevantLTM`) digabungkan untuk membentuk *full prompt* yang kaya konteks.
    * **Thought/Planning (`currentThought`):** Memungkinkan agen untuk mempertahankan "pemikiran internal" antar iterasi, membantu melacak tindakan yang telah dilakukan dan memandu LLM menuju langkah logis berikutnya.
    * **Function Calling (Tools):** LLM diinstruksikan untuk menggunakan kemampuan *function calling* dengan menyediakan definisi *tool* (`toolManager.getToolDefinitions()`), memungkinkan LLM secara cerdas memutuskan kapan dan bagaimana memanggil fungsi eksternal.

## Hasil & Refleksi

### Hasil

* Agen berhasil mendemonstrasikan siklus `observe → decide → act`.
* Mampu menjawab pertanyaan umum.
* Mampu menggunakan *tool* sederhana seperti *code interpreter* dan *documentation search*.
* Arsitektur modular mendukung penambahan *tool* dan strategi memori yang lebih kompleks di masa mendatang.

### Kendala yang Ditemui

1.  **Keamanan Eksekusi Kode:** Implementasi `eval()` dalam `code_interpreter` **sangat tidak aman** untuk lingkungan produksi. Menjalankan kode arbitrer dari LLM tanpa *sandboxing* dapat menyebabkan kerentanan keamanan yang serius.
2.  **Manajemen Memori LTM Sederhana:** Implementasi LTM saat ini hanya berupa pencarian *substring* sederhana, yang tidak efektif untuk kumpulan data pengetahuan yang besar dan tidak menangkap kesamaan semantik.
3.  **Prompt Engineering:** Membuat *prompt* yang efektif agar LLM selalu memberikan respons yang diinginkan memerlukan *fine-tuning* dan pengujian ekstensif. LLM kadang dapat "berhalusinasi" atau gagal menggunakan *tool* dengan benar.
4.  **Kompleksitas Agent Loop:** *Agent loop* sederhana mungkin tidak cukup untuk tugas *coding* yang sangat kompleks yang memerlukan perencanaan multi-langkah atau *self-correction*.
5.  **Biaya LLM:** Penggunaan LLM tingkat tinggi seperti GPT-4o untuk setiap langkah dalam *agent loop* bisa menjadi mahal, terutama untuk tugas yang berulang atau memerlukan banyak iterasi.
6.  **Latensi:** Setiap panggilan ke LLM memperkenalkan latensi, membuat agen terasa lambat untuk interaksi waktu nyata.

### Solusi Potensial

1.  **Keamanan Eksekusi Kode:** Gunakan lingkungan **sandboxed** yang terisolasi (misalnya, Docker *container*, WebAssembly, atau layanan *cloud* tanpa server yang dirancang untuk eksekusi kode) untuk mengeksekusi kode. **Jangan pernah menggunakan `eval()` di lingkungan produksi.**
2.  **Manajemen Memori LTM Canggih:** Integrasikan **Vector Database** (misalnya, Pinecone, Weaviate, ChromaDB, Qdrant) dengan model *embedding* (misalnya, OpenAI Embeddings, Cohere Embeddings) untuk implementasi RAG yang kuat. Ini akan memungkinkan agen untuk mengambil informasi yang paling relevan secara semantik dari kumpulan data pengetahuan yang besar.
3.  **Peningkatan Agen & Prompt Engineering Lanjutan:**
    * Gunakan teknik **ReAct** (Reasoning and Acting) yang lebih canggih.
    * Pertimbangkan agen yang mendukung **perencanaan** (misalnya, "Plan-and-Execute" dari LangChain) untuk tugas multi-langkah.
    * Desain agen untuk **Self-Correction**, memungkinkannya mengidentifikasi dan memperbaiki kesalahannya sendiri jika *tool* gagal atau respons LLM tidak memadai.
4.  **Optimasi Biaya:**
    * Gunakan LLM yang lebih kecil dan lebih murah untuk tugas-tugas yang lebih sederhana.
    * Terapkan **Caching** untuk respons LLM yang sering diminta atau hasil *tool*.
    * **Batching** kueri jika memungkinkan.
5.  **Mengurangi Latensi:**
    * Optimalkan panggilan API ke LLM (misalnya, dengan *streaming*).
    * Lakukan komputasi *on-device* atau *pre-processing* sebisanya.
6.  **Pengembangan Tool yang Kuat:** Kembangkan *tool* yang komprehensif untuk pengembang, seperti:
    * Operasi sistem berkas (baca/tulis *file*, daftar direktori).
    * Integrasi Git (*commit*, *branch*, *pull/push*).
    * Integrasi dengan Linter dan Formatter (ESLint, Prettier).
    * *Test Runner* (Jest, Vitest).
    * *Debuggers*.
    * Integrasi dengan API *Issue Tracker* (Jira, GitHub Issues).

---
