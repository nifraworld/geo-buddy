/* Curated Bangladesh division content.
   Facts, area and population from the BBS 2022 Population & Housing Census
   (as tabulated in the Divisions of Bangladesh reference). English names use the
   official post-2018 spellings (Chattogram, Barishal). Bangla names are standard
   Bangladeshi usage.

   `photo` is an ordered candidate list of Wikimedia Commons file names; the build
   resolves the first one that exists and records author + licence for credit. */

export const DIVISIONS = [
  {
    id: "dhaka", en: "Dhaka", bn: "ঢাকা", hq: "Dhaka", hqBn: "ঢাকা",
    iso: "BD-C", est: 1829, districts: 13, upazilas: 90, unions: 885,
    areaKm2: 20593.74, pop: 44215107, density: 2147,
    rivers: [["Buriganga", "বুড়িগঙ্গা"], ["Turag", "তুরাগ"], ["Shitalakshya", "শীতলক্ষ্যা"], ["Meghna", "মেঘনা"]],
    factEn: "The most populous division and the seat of government. Dhaka city began as a Mughal capital in 1610 and is home to the Jatiya Sangsad Bhaban (National Parliament), designed by Louis Kahn.",
    factBn: "সর্বাধিক জনবহুল বিভাগ এবং সরকারের কেন্দ্র। ঢাকা শহর ১৬১০ সালে মোগল রাজধানী হিসেবে গড়ে ওঠে; এখানে লুই কান-নির্মিত জাতীয় সংসদ ভবন অবস্থিত।",
    photo: ["National Parliament of Bangladesh (06).jpg", "Jatiya Sangsad Bhaban, Dhaka.jpg", "Lalbagh Fort, Dhaka.jpg", "Dhaka city skyline.jpg"],
  },
  {
    id: "chattogram", en: "Chattogram", bn: "চট্টগ্রাম", hq: "Chattogram", hqBn: "চট্টগ্রাম",
    iso: "BD-B", est: 1829, districts: 11, upazilas: 104, unions: 949,
    areaKm2: 33908.55, pop: 33202326, density: 979,
    rivers: [["Karnaphuli", "কর্ণফুলী"], ["Halda", "হালদা"], ["Sangu", "সাঙ্গু"], ["Matamuhuri", "মাতামুহুরি"]],
    factEn: "The largest division by area. Its port city is Bangladesh's main seaport; the division also holds Cox's Bazar, the world's longest natural sea beach, and the forested Chittagong Hill Tracts.",
    factBn: "আয়তনে বৃহত্তম বিভাগ। এর বন্দরনগরী দেশের প্রধান সমুদ্রবন্দর; এখানে বিশ্বের দীর্ঘতম প্রাকৃতিক সমুদ্র সৈকত কক্সবাজার এবং বনাঞ্চল চট্টগ্রাম পাহাড়ি অঞ্চল রয়েছে।",
    photo: ["Cox's Bazar sea beach 01.jpg", "Chittagong city skyline.jpg", "Karnaphuli River near Rangunia, Chattogram.jpg", "Foys Lake, Chittagong.jpg"],
  },
  {
    id: "rajshahi", en: "Rajshahi", bn: "রাজশাহী", hq: "Rajshahi", hqBn: "রাজশাহী",
    iso: "BD-E", est: 1829, districts: 8, upazilas: 67, unions: 565,
    areaKm2: 18153.08, pop: 20353119, density: 1121,
    rivers: [["Padma", "পদ্মা"], ["Atrai", "আত্রাই"], ["Mahananda", "মহানন্দা"], ["Jamuna", "যমুনা"]],
    factEn: "Known as the Silk City and for its sweet mangoes. The ancient Varendra region is here, and Paharpur's Somapura Mahavihara — a UNESCO World Heritage Site — is the largest Buddhist monastery south of the Himalayas.",
    factBn: "সিল্ক সিটি ও মিষ্টি আমের জন্য বিখ্যাত। প্রাচীন বরেন্দ্র অঞ্চল এখানেই; পাহাড়পুরের সোমপুর মহাবিহার (ইউনেস্কো বিশ্ব ঐতিহ্য) হিমালয়ের দক্ষিণে বৃহত্তম বৌদ্ধ বিহার।",
    photo: ["Somapura Mahavihara.jpg", "Paharpur Buddhist Vihara, Bangladesh.jpg", "Varendra Research Museum.jpg", "Mango garden Rajshahi.jpg"],
  },
  {
    id: "khulna", en: "Khulna", bn: "খুলনা", hq: "Khulna", hqBn: "খুলনা",
    iso: "BD-D", est: 1960, districts: 10, upazilas: 59, unions: 571,
    areaKm2: 22284.22, pop: 17416645, density: 782,
    rivers: [["Rupsha", "রূপসা"], ["Bhairab", "ভৈরব"], ["Kobadak", "কপোতাক্ষ"], ["Pashur", "পাশুর"]],
    factEn: "The gateway to the Sundarbans, the world's largest mangrove forest and home of the Royal Bengal Tiger. Bagerhat's historic mosque city, including the Sixty Dome Mosque, is a UNESCO World Heritage Site.",
    factBn: "সুন্দরবনের প্রবেশদ্বার — বিশ্বের বৃহত্তম ম্যানগ্রোভ বন ও রয়েল বেঙ্গল টাইগারের আবাস। বাগেরহাটের ঐতিহাসিক মসজিদ নগরী (ষাট গম্বুজ মসজিদসহ) ইউনেস্কো বিশ্ব ঐতিহ্য।",
    photo: ["Sixty Dome Mosque, Bagerhat.jpg", "Shat Gombuj Mosque.jpg", "Sundarbans National Park.jpg", "Sundarban.jpg"],
  },
  {
    id: "barishal", en: "Barishal", bn: "বরিশাল", hq: "Barishal", hqBn: "বরিশাল",
    iso: "BD-A", est: 1993, districts: 6, upazilas: 42, unions: 352,
    areaKm2: 13225.20, pop: 9100102, density: 688,
    rivers: [["Kirtankhola", "কীর্তনখোলা"], ["Arialkha", "আড়িয়াল খাঁ"], ["Bishkhali", "বিষখালী"], ["Payra", "পায়রা"]],
    factEn: "The least populous division, called the 'Venice of Bengal' for its many rivers and canals. Kuakata beach here is one of the few places where both sunrise and sunset can be seen over the sea.",
    factBn: "সর্বনিম্ন জনবহুল বিভাগ; নদী ও খালের জন্য 'বাংলার ভেনিস' নামে পরিচিত। কুয়াকাটা সৈকত এখানেই — যেখানে সমুদ্রে সূর্যোদয় ও সূর্যাস্ত দুটোই দেখা যায়।",
    photo: ["Kuakata beach.jpg", "Kuakata Sea Beach.jpg", "Kirtankhola River.jpg", "Payra River.jpg"],
  },
  {
    id: "sylhet", en: "Sylhet", bn: "সিলেট", hq: "Sylhet", hqBn: "সিলেট",
    iso: "BD-G", est: 1996, districts: 4, upazilas: 40, unions: 338,
    areaKm2: 12635.22, pop: 11034863, density: 873,
    rivers: [["Surma", "সুরমা"], ["Kushiyara", "কুশিয়ারা"], ["Manu", "মনু"]],
    factEn: "The land of tea gardens and green hills. Srimangal is called the tea capital of Bangladesh, and the shrine of Hazrat Shah Jalal (R) draws visitors from across the country.",
    factBn: "চা বাগান ও সবুজ পাহাড়ের দেশ। শ্রীমঙ্গলকে বাংলাদেশের চা-রাজধানী বলা হয়; হযরত শাহজালাল (রহ.)-এর মাজার সারা দেশ থেকে দর্শনার্থী আকর্ষণ করে।",
    photo: ["Ratargul Swamp Forest.jpg", "Sylhet tea garden.jpg", "Tea Plantation Srimangal.jpg", "Jaflong.jpg"],
  },
  {
    id: "rangpur", en: "Rangpur", bn: "রংপুর", hq: "Rangpur", hqBn: "রংপুর",
    iso: "BD-F", est: 2010, districts: 8, upazilas: 58, unions: 535,
    areaKm2: 16184.99, pop: 17610956, density: 1088,
    rivers: [["Teesta", "তিস্তা"], ["Dharla", "ধরলা"], ["Karatoya", "করতোয়া"], ["Atrai", "আত্রাই"]],
    factEn: "Created in 2010 as the seventh division, it sits in the historic Varendra region. The Tajhat Rajbari (palace) and the ancient settlements of the north make it rich in heritage and agriculture.",
    factBn: "২০১০ সালে সপ্তম বিভাগ হিসেবে গঠিত, ঐতিহাসিক বরেন্দ্র অঞ্চলে অবস্থিত। তাজহাট রাজবাড়ি ও উত্তরের প্রাচীন জনপদ এ অঞ্চলকে ঐতিহ্য ও কৃষিতে সমৃদ্ধ করেছে।",
    photo: ["Tajhat Rajbari.jpg", "Kantajew Temple.jpg", "Kantaji Temple.jpg", "Tajhat Palace.jpg"],
  },
  {
    id: "mymensingh", en: "Mymensingh", bn: "ময়মনসিংহ", hq: "Mymensingh", hqBn: "ময়মনসিংহ",
    iso: "BD-H", est: 2015, districts: 4, upazilas: 35, unions: 351,
    areaKm2: 10584.06, pop: 12225498, density: 1155,
    rivers: [["Old Brahmaputra", "পুরাতন ব্রহ্মপুত্র"], ["Kangsha", "কংস"], ["Someshwari", "সোমেশ্বরী"]],
    factEn: "The newest and smallest division, created in 2015. It is home to the Bangladesh Agricultural University and the Shilpacharya Zainul Abedin museum, and is known for folk music and the Brahmaputra river.",
    factBn: "সবচেয়ে নতুন ও ক্ষুদ্রতম বিভাগ, ২০১৫ সালে গঠিত। এখানে বাংলাদেশ কৃষি বিশ্ববিদ্যালয় ও শিল্পাচার্য জয়নুল আবেদিন সংগ্রহশালা; লোকসংগীত ও ব্রহ্মপুত্র নদের জন্য পরিচিত।",
    photo: ["Shashi Lodge, Mymensingh.jpg", "Mymensingh Rajbari.jpg", "Old Brahmaputra River, Mymensingh.jpg", "Bangladesh Agricultural University.jpg"],
  },
];

export const NATIONAL = {
  en: "Bangladesh", bn: "বাংলাদেশ",
  capitalEn: "Dhaka", capitalBn: "ঢাকা",
  divisions: 8, districts: 64, upazilas: 495, unions: 4546,
  areaKm2: 147569,
  source: "Bangladesh Bureau of Statistics, 2022 Population and Housing Census",
  updated: "2026",
};