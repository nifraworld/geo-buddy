/* Curated Bangladesh district content.
   Population and area: BBS 2022 Census (via geo-ref.net).
   English names: official post-2018 spellings matching divisions.mjs.
   Bangla names: standard Bangladeshi usage from administrative boundary data. */

export const DISTRICTS = [
  // Barishal division
  { id:"barguna",      en:"Barguna",        bn:"বরগুনা",       div:"barishal",  iso:"BD-02", pop:1035595,   areaKm2:1831 },
  { id:"barishal",     en:"Barishal",       bn:"বরিশাল",       div:"barishal",  iso:"BD-06", pop:2634207,   areaKm2:2785 },
  { id:"bhola",        en:"Bhola",          bn:"ভোলা",         div:"barishal",  iso:"BD-07", pop:1980447,   areaKm2:3403 },
  { id:"jhalokati",    en:"Jhalokati",      bn:"ঝালকাঠি",      div:"barishal",  iso:"BD-23", pop:677560,    areaKm2:749 },
  { id:"patuakhali",   en:"Patuakhali",     bn:"পটুয়াখালী",    div:"barishal",  iso:"BD-51", pop:1770096,   areaKm2:3221 },
  { id:"pirojpur",     en:"Pirojpur",       bn:"পিরোজপুর",     div:"barishal",  iso:"BD-50", pop:1227913,   areaKm2:1308 },

  // Chattogram division
  { id:"bandarban",    en:"Bandarban",      bn:"বান্দরবান",    div:"chattogram",iso:"BD-01", pop:495255,    areaKm2:4479 },
  { id:"brahmanbaria", en:"Brahmanbaria",   bn:"ব্রাহ্মণবাড়িয়া",div:"chattogram",iso:"BD-04", pop:3403782,   areaKm2:1927 },
  { id:"chandpur",     en:"Chandpur",       bn:"চাঁদপুর",      div:"chattogram",iso:"BD-09", pop:2713247,   areaKm2:1704 },
  { id:"chattogram",   en:"Chattogram",     bn:"চট্টগ্রাম",     div:"chattogram",iso:"BD-10", pop:9439076,   areaKm2:5283 },
  { id:"coxsbazar",    en:"Cox's Bazar",    bn:"কক্সবাজার",   div:"chattogram",iso:"BD-11", pop:2906278,   areaKm2:2492 },
  { id:"cumilla",      en:"Cumilla",        bn:"কুমিল্লা",      div:"chattogram",iso:"BD-08", pop:6394875,   areaKm2:3085 },
  { id:"feni",         en:"Feni",           bn:"ফেনী",          div:"chattogram",iso:"BD-16", pop:1697379,   areaKm2:928 },
  { id:"khagrachari",  en:"Khagrachari",    bn:"খাগড়াছড়ি",    div:"chattogram",iso:"BD-29", pop:735116,    areaKm2:2700 },
  { id:"lakshmipur",   en:"Lakshmipur",     bn:"লক্ষ্মীপুর",   div:"chattogram",iso:"BD-31", pop:1995098,   areaKm2:1456 },
  { id:"noakhali",     en:"Noakhali",       bn:"নোয়াখালী",     div:"chattogram",iso:"BD-47", pop:3731846,   areaKm2:3601 },
  { id:"rangamati",    en:"Rangamati",      bn:"রাঙ্গামাটি",    div:"chattogram",iso:"BD-56", pop:666628,    areaKm2:6116 },

  // Dhaka division
  { id:"dhaka",        en:"Dhaka",          bn:"ঢাকা",          div:"dhaka",     iso:"BD-13", pop:15210154,  areaKm2:1464 },
  { id:"faridpur",     en:"Faridpur",       bn:"ফরিদপুর",      div:"dhaka",     iso:"BD-15", pop:2232769,   areaKm2:2073 },
  { id:"gazipur",      en:"Gazipur",        bn:"গাজীপুর",       div:"dhaka",     iso:"BD-18", pop:5433563,   areaKm2:1800 },
  { id:"gopalganj",    en:"Gopalganj",      bn:"গোপালগঞ্জ",    div:"dhaka",     iso:"BD-17", pop:1336903,   areaKm2:1490 },
  { id:"kishoreganj",  en:"Kishoreganj",    bn:"কিশোরগঞ্জ",    div:"dhaka",     iso:"BD-26", pop:3373223,   areaKm2:2689 },
  { id:"madaripur",    en:"Madaripur",      bn:"মাদারীপুর",     div:"dhaka",     iso:"BD-36", pop:1334811,   areaKm2:1145 },
  { id:"manikganj",    en:"Manikganj",      bn:"মানিকগঞ্জ",    div:"dhaka",     iso:"BD-33", pop:1608371,   areaKm2:1379 },
  { id:"munshiganj",   en:"Munshiganj",     bn:"মুন্সিগঞ্জ",    div:"dhaka",     iso:"BD-35", pop:1677943,   areaKm2:955 },
  { id:"narayanganj",  en:"Narayanganj",    bn:"নারায়ণগঞ্জ",  div:"dhaka",     iso:"BD-40", pop:4035462,   areaKm2:700 },
  { id:"narsingdi",    en:"Narsingdi",      bn:"নরসিংদী",       div:"dhaka",     iso:"BD-42", pop:2667968,   areaKm2:1141 },
  { id:"rajbari",      en:"Rajbari",        bn:"রাজবাড়ী",      div:"dhaka",     iso:"BD-53", pop:1228270,   areaKm2:1119 },
  { id:"shariatpur",   en:"Shariatpur",     bn:"শরীয়তপুর",    div:"dhaka",     iso:"BD-62", pop:1336395,   areaKm2:1182 },
  { id:"tangail",      en:"Tangail",        bn:"টাঙ্গাইল",      div:"dhaka",     iso:"BD-63", pop:4168083,   areaKm2:3414 },

  // Khulna division
  { id:"bagerhat",     en:"Bagerhat",       bn:"বাগেরহাট",     div:"khulna",    iso:"BD-05", pop:1649877,   areaKm2:3959 },
  { id:"chuadanga",    en:"Chuadanga",      bn:"চুয়াডাঙ্গা",   div:"khulna",    iso:"BD-12", pop:1262218,   areaKm2:1177 },
  { id:"jashore",      en:"Jashore",        bn:"যশোর",          div:"khulna",    iso:"BD-25", pop:3147039,   areaKm2:2567 },
  { id:"jhenaidah",    en:"Jhenaidah",      bn:"ঝিনাইদহ",       div:"khulna",    iso:"BD-24", pop:2051607,   areaKm2:1961 },
  { id:"khulna",       en:"Khulna",         bn:"খুলনা",         div:"khulna",    iso:"BD-27", pop:2673002,   areaKm2:4394 },
  { id:"kushtia",      en:"Kushtia",        bn:"কুষ্টিয়া",      div:"khulna",    iso:"BD-30", pop:2198731,   areaKm2:1601 },
  { id:"magura",       en:"Magura",         bn:"মাগুরা",         div:"khulna",    iso:"BD-37", pop:1056683,   areaKm2:1049 },
  { id:"meherpur",     en:"Meherpur",       bn:"মেহেরপুর",      div:"khulna",    iso:"BD-38", pop:721447,    areaKm2:716 },
  { id:"narail",       en:"Narail",         bn:"নড়াইল",         div:"khulna",    iso:"BD-43", pop:806664,    areaKm2:990 },
  { id:"satkhira",     en:"Satkhira",       bn:"সাতক্ষীরা",     div:"khulna",    iso:"BD-58", pop:2246690,   areaKm2:3858 },

  // Mymensingh division
  { id:"jamalpur",     en:"Jamalpur",       bn:"জামালপুর",      div:"mymensingh",iso:"BD-22", pop:2583984,   areaKm2:2032 },
  { id:"mymensingh",   en:"Mymensingh",     bn:"ময়মনসিংহ",     div:"mymensingh",iso:"BD-34", pop:6097863,   areaKm2:4363 },
  { id:"netrokona",    en:"Netrokona",      bn:"নেত্রকোণা",    div:"mymensingh",iso:"BD-41", pop:2403209,   areaKm2:2810 },
  { id:"sherpur",      en:"Sherpur",        bn:"শেরপুর",        div:"mymensingh",iso:"BD-57", pop:1552469,   areaKm2:1364 },

  // Rajshahi division
  { id:"bogura",       en:"Bogura",         bn:"বগুড়া",         div:"rajshahi",  iso:"BD-03", pop:3815195,   areaKm2:2920 },
  { id:"joypurhat",    en:"Joypurhat",      bn:"জয়পুরহাট",      div:"rajshahi",  iso:"BD-21", pop:977149,    areaKm2:965 },
  { id:"naogaon",      en:"Naogaon",        bn:"নওগাঁ",          div:"rajshahi",  iso:"BD-48", pop:2844920,   areaKm2:3436 },
  { id:"natore",       en:"Natore",         bn:"নাটোর",          div:"rajshahi",  iso:"BD-44", pop:1900212,   areaKm2:1896 },
  { id:"nawabganj",    en:"Chapai Nawabganj",bn:"চাঁপাইনবাবগঞ্জ",     div:"rajshahi",  iso:"BD-45", pop:1875290,   areaKm2:1703 },
  { id:"pabna",        en:"Pabna",          bn:"পাবনা",          div:"rajshahi",  iso:"BD-49", pop:2972652,   areaKm2:2372 },
  { id:"rajshahi",     en:"Rajshahi",       bn:"রাজশাহী",       div:"rajshahi",  iso:"BD-54", pop:2978160,   areaKm2:2407 },
  { id:"sirajgonj",    en:"Sirajganj",      bn:"সিরাজগঞ্জ",     div:"rajshahi",  iso:"BD-59", pop:3430445,   areaKm2:2498 },

  // Rangpur division
  { id:"dinajpur",     en:"Dinajpur",       bn:"দিনাজপুর",      div:"rangpur",   iso:"BD-14", pop:3392254,   areaKm2:3438 },
  { id:"gaibandha",    en:"Gaibandha",      bn:"গাইবান্ধা",     div:"rangpur",   iso:"BD-19", pop:2621755,   areaKm2:2179 },
  { id:"kurigram",     en:"Kurigram",       bn:"কুড়িগ্রাম",     div:"rangpur",   iso:"BD-28", pop:2383269,   areaKm2:2296 },
  { id:"lalmonirhat",  en:"Lalmonirhat",    bn:"লালমনিরহাট",    div:"rangpur",   iso:"BD-32", pop:1461589,   areaKm2:1241 },
  { id:"nilphamari",   en:"Nilphamari",     bn:"নীলফামারী",     div:"rangpur",   iso:"BD-46", pop:2141179,   areaKm2:1580 },
  { id:"panchagarh",   en:"Panchagarh",     bn:"পঞ্চগড়",       div:"rangpur",   iso:"BD-52", pop:1207252,   areaKm2:1405 },
  { id:"rangpur",      en:"Rangpur",        bn:"রংপুর",          div:"rangpur",   iso:"BD-55", pop:3243248,   areaKm2:2368 },
  { id:"thakurgaon",   en:"Thakurgaon",     bn:"ঠাকুরগাঁও",     div:"rangpur",   iso:"BD-64", pop:1569528,   areaKm2:1810 },

  // Sylhet division
  { id:"habiganj",     en:"Habiganj",       bn:"হবিগঞ্জ",       div:"sylhet",    iso:"BD-20", pop:2440151,   areaKm2:2637 },
  { id:"maulvibazar",  en:"Maulvibazar",    bn:"মৌলভীবাজার",   div:"sylhet",    iso:"BD-39", pop:2196599,   areaKm2:2799 },
  { id:"sunamganj",    en:"Sunamganj",      bn:"সুনামগঞ্জ",     div:"sylhet",    iso:"BD-61", pop:2788357,   areaKm2:3670 },
  { id:"sylhet",       en:"Sylhet",         bn:"সিলেট",         div:"sylhet",    iso:"BD-60", pop:3989914,   areaKm2:3490 },
];
