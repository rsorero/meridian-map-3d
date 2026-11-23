// Meridian metadata, classical point categories, extraordinary vessels and the five phases.

export const MERIDIANS = [
  { id: 'LU', name: 'Lung', zh: '手太阴肺经', py: 'Shou Taiyin Fei Jing', full: 'Lung Channel of Hand-Taiyin', el: 'Metal', yy: 'Yin', limb: 'Hand', level: 'Taiyin', partner: 'LI', time: [3, 5], color: '#8fd3ff',
    path: 'Arises in the middle jiao, descends to the Large Intestine, returns past the stomach, passes through the diaphragm into the Lungs, rises to the throat and emerges at LU1 below the clavicle. It runs down the anterolateral (radial) side of the arm to the wrist, crosses the thenar eminence and ends at the radial corner of the thumbnail (LU11). A branch from LU7 goes to the tip of the index finger to connect with the Large Intestine channel.',
    fn: 'Governs qi and respiration; controls the dispersing and descending of qi; regulates the water passages; governs the skin and body hair; opens into the nose. Emotion: grief. Spirit: Po (corporeal soul).' },
  { id: 'LI', name: 'Large Intestine', zh: '手阳明大肠经', py: 'Shou Yangming Dachang Jing', full: 'Large Intestine Channel of Hand-Yangming', el: 'Metal', yy: 'Yang', limb: 'Hand', level: 'Yangming', partner: 'LU', time: [5, 7], color: '#5f8dff',
    path: 'Starts at the radial corner of the index fingernail (LI1), runs between the 1st and 2nd metacarpals (LI4), up the radial side of the forearm to the lateral elbow (LI11), along the lateral upper arm to the shoulder (LI15), meets the Du Mai at GV14, then enters the supraclavicular fossa. An internal branch connects with the Lungs and Large Intestine; the external branch ascends the neck and cheek, crosses at the philtrum (GV26) and ends beside the opposite nostril (LI20).',
    fn: 'Receives waste from the Small Intestine, absorbs fluids and excretes stools. Clinically the channel is used heavily for the face, teeth, nose, throat, skin and for clearing heat.' },
  { id: 'ST', name: 'Stomach', zh: '足阳明胃经', py: 'Zu Yangming Wei Jing', full: 'Stomach Channel of Foot-Yangming', el: 'Earth', yy: 'Yang', limb: 'Foot', level: 'Yangming', partner: 'SP', time: [7, 9], color: '#ffb020',
    path: 'Begins beside the nose, meets the Bladder channel at BL1 and emerges below the eye (ST1). It descends to the mouth, curves along the jaw to ST6, ascends in front of the ear to the forehead corner (ST8). From ST5 a branch descends the neck (ST9), crosses the chest along the nipple line, runs 2 cun lateral to the midline over the abdomen to the groin (ST30), then down the anterolateral thigh, lateral to the tibia (ST36) to the dorsum of the foot and ends at the lateral corner of the 2nd toenail (ST45). Branches connect to the big toe (SP1) and the middle toe.',
    fn: 'Receives and "rots and ripens" food; controls descending; the origin of fluids. Its channel carries abundant qi and blood, making it central for digestion, energy, the face and the legs.' },
  { id: 'SP', name: 'Spleen', zh: '足太阴脾经', py: 'Zu Taiyin Pi Jing', full: 'Spleen Channel of Foot-Taiyin', el: 'Earth', yy: 'Yin', limb: 'Foot', level: 'Taiyin', partner: 'ST', time: [9, 11], color: '#ffe066',
    path: 'Starts at the medial corner of the big toenail (SP1), runs along the medial foot at the junction of red and white skin, passes in front of the medial malleolus, ascends behind the tibia (SP6), crosses in front of the Liver channel, ascends the medial knee and thigh, enters the abdomen 4 cun lateral to the midline, connects with the Spleen and Stomach, rises through the chest 6 cun lateral to the midline and ends at SP21 on the side of the chest. Internal branches reach the root of the tongue and the Heart.',
    fn: 'Governs transformation and transportation of food and fluids; holds blood in the vessels; controls the muscles and four limbs; raises qi; opens into the mouth. Emotion: pensiveness. Spirit: Yi (intellect).' },
  { id: 'HT', name: 'Heart', zh: '手少阴心经', py: 'Shou Shaoyin Xin Jing', full: 'Heart Channel of Hand-Shaoyin', el: 'Fire', yy: 'Yin', limb: 'Hand', level: 'Shaoyin', partner: 'SI', time: [11, 13], color: '#ff4d6d',
    path: 'Originates in the Heart, connects with the Small Intestine, sends a branch up beside the throat to the eye, and emerges at the axilla (HT1). It descends along the medial (ulnar-anterior) side of the arm, behind the Pericardium and Lung channels, to the pisiform at the wrist (HT7), crosses the palm and ends at the radial corner of the little fingernail (HT9).',
    fn: 'Governs blood and the blood vessels; houses the Shen (mind/spirit); manifests in the complexion; opens into the tongue; controls sweat. Emotion: joy.' },
  { id: 'SI', name: 'Small Intestine', zh: '手太阳小肠经', py: 'Shou Taiyang Xiaochang Jing', full: 'Small Intestine Channel of Hand-Taiyang', el: 'Fire', yy: 'Yang', limb: 'Hand', level: 'Taiyang', partner: 'HT', time: [13, 15], color: '#ff8fa3',
    path: 'Starts at the ulnar corner of the little fingernail (SI1), runs along the ulnar border of the hand and forearm, between the olecranon and medial epicondyle (SI8), up the posterior upper arm, zig-zags across the scapula (SI9–SI15), meets the Du Mai at GV14, enters the supraclavicular fossa, ascends the neck to the cheek and ends in front of the ear (SI19). Internally it links the Heart and Small Intestine.',
    fn: 'Receives food from the Stomach and separates the clear from the turbid. Clinically important for the neck, shoulder blade, ears and for clarifying judgement.' },
  { id: 'BL', name: 'Bladder', zh: '足太阳膀胱经', py: 'Zu Taiyang Pangguang Jing', full: 'Bladder Channel of Foot-Taiyang', el: 'Water', yy: 'Yang', limb: 'Foot', level: 'Taiyang', partner: 'KI', time: [15, 17], color: '#2ed3c6',
    path: 'The longest channel (67 points). Starts at the inner canthus (BL1), ascends the forehead and passes over the vertex 1.5 cun from the midline to the nape (BL10). It then divides into two lines down the back — 1.5 cun from the spine (containing the Back-Shu points of every organ) and 3 cun from the spine — which descend over the sacrum and buttocks and rejoin in the popliteal fossa (BL40). It continues down the calf, behind the lateral malleolus (BL60), along the lateral border of the foot and ends at the lateral corner of the little toenail (BL67).',
    fn: 'Stores and excretes urine using qi from the Kidneys. Through the Back-Shu points the channel reaches every organ; it is also the main channel of the head, back and posterior leg.' },
  { id: 'KI', name: 'Kidney', zh: '足少阴肾经', py: 'Zu Shaoyin Shen Jing', full: 'Kidney Channel of Foot-Shaoyin', el: 'Water', yy: 'Yin', limb: 'Foot', level: 'Shaoyin', partner: 'BL', time: [17, 19], color: '#7b6cff',
    path: 'Begins under the little toe, crosses to the sole (KI1), emerges below the navicular (KI2), circles behind the medial malleolus (KI3–KI6), ascends the posteromedial leg and thigh, meets GV1, enters the Kidneys and Bladder, and emerges on the abdomen 0.5 cun lateral to the midline (KI11–KI21). It rises over the chest 2 cun from the midline to end below the clavicle (KI27). Internal branches pass through Liver, diaphragm, Lungs and throat to the root of the tongue, and connect with the Heart.',
    fn: 'Stores essence (Jing); governs birth, growth, reproduction and development; produces marrow, fills the brain and controls bones; governs water; grasps qi; opens into the ears. Emotion: fear. Spirit: Zhi (will).' },
  { id: 'PC', name: 'Pericardium', zh: '手厥阴心包经', py: 'Shou Jueyin Xinbao Jing', full: 'Pericardium Channel of Hand-Jueyin', el: 'Fire', yy: 'Yin', limb: 'Hand', level: 'Jueyin', partner: 'SJ', time: [19, 21], color: '#ff6ad5',
    path: 'Originates in the chest and Pericardium, descends through the diaphragm connecting all three jiao. A branch emerges 1 cun lateral to the nipple (PC1), curves over the axilla, descends the midline of the anterior arm between the Lung and Heart channels, passes between the two forearm tendons (PC6), crosses the centre of the palm (PC8) and ends at the tip of the middle finger (PC9). A palm branch goes to the ring finger to meet the Sanjiao channel.',
    fn: 'The protector of the Heart; houses the mind with the Heart. Clinically central for the chest, emotional distress, nausea and the Stomach.' },
  { id: 'SJ', name: 'Sanjiao', zh: '手少阳三焦经', py: 'Shou Shaoyang Sanjiao Jing', full: 'Sanjiao (Triple Burner) Channel of Hand-Shaoyang', el: 'Fire', yy: 'Yang', limb: 'Hand', level: 'Shaoyang', partner: 'PC', time: [21, 23], color: '#c792ff',
    path: 'Starts at the ulnar corner of the ring fingernail (SJ1), runs between the 4th and 5th metacarpals, up the middle of the dorsal forearm between radius and ulna (SJ5), over the olecranon, along the posterior upper arm to the shoulder (SJ14), crosses GB21, enters the supraclavicular fossa and spreads in the chest linking the upper, middle and lower jiao. An external branch ascends the neck, circles behind the ear (SJ17–SJ20), passes in front of it and ends at the lateral end of the eyebrow (SJ23).',
    fn: 'Coordinates the passage of qi and fluids through the three burners (upper, middle, lower jiao). Clinically used for the ears, temples, lateral neck and for exterior wind-heat.' },
  { id: 'GB', name: 'Gall Bladder', zh: '足少阳胆经', py: 'Zu Shaoyang Dan Jing', full: 'Gall Bladder Channel of Foot-Shaoyang', el: 'Wood', yy: 'Yang', limb: 'Foot', level: 'Shaoyang', partner: 'LR', time: [23, 1], color: '#52d273',
    path: 'Starts at the outer canthus (GB1), zig-zags over the side of the head — down in front of the ear, up over the temple, back around the ear to the mastoid, then forward to the forehead (GB14) and back over the head to the occiput (GB20). It descends to the top of the shoulder (GB21), along the side of the chest and waist (GB22–GB30), down the lateral thigh and leg (GB34), in front of the lateral malleolus (GB40) and over the dorsum of the foot to the lateral corner of the 4th toenail (GB44).',
    fn: 'Stores and excretes bile; controls judgement and decisiveness; nourishes the sinews. Its channel governs the sides of the body, the temples and the hips.' },
  { id: 'LR', name: 'Liver', zh: '足厥阴肝经', py: 'Zu Jueyin Gan Jing', full: 'Liver Channel of Foot-Jueyin', el: 'Wood', yy: 'Yin', limb: 'Foot', level: 'Jueyin', partner: 'GB', time: [1, 3], color: '#1fa463',
    path: 'Starts at the lateral corner of the big toenail (LR1), runs over the dorsum of the foot between the 1st and 2nd metatarsals (LR3), in front of the medial malleolus, up the medial surface of the tibia (crossing behind the Spleen channel 8 cun above the malleolus), along the medial knee and thigh, circles the external genitalia, ascends the lower abdomen, and ends below the nipple at LR14. Internally it connects the Liver and Gall Bladder, spreads in the hypochondrium, rises along the throat to the eyes and meets the Du Mai at the vertex. A branch goes to the Lungs, linking back to LU1.',
    fn: 'Stores blood; ensures the smooth flow of qi; controls the sinews; manifests in the nails; opens into the eyes. Emotion: anger. Spirit: Hun (ethereal soul).' },
  { id: 'CV', name: 'Conception Vessel', zh: '任脉', py: 'Ren Mai', full: 'Conception Vessel (Ren Mai)', el: null, yy: 'Yin', limb: 'Midline', level: 'Extraordinary', partner: 'GV', time: null, color: '#ffe3b8',
    path: 'Arises in the lower abdomen (uterus), emerges at the perineum (CV1), ascends the anterior midline over the pubic bone, abdomen, chest and throat to the chin (CV24), then encircles the lips and rises to the eyes. One of the eight extraordinary vessels and one of the two with its own points.',
    fn: 'The "Sea of the Yin channels": regulates all yin channels, governs the uterus, fertility and pregnancy, and holds the Front-Mu points of many organs. Opened by LU7, paired with KI6.' },
  { id: 'GV', name: 'Governing Vessel', zh: '督脉', py: 'Du Mai', full: 'Governing Vessel (Du Mai)', el: null, yy: 'Yang', limb: 'Midline', level: 'Extraordinary', partner: 'CV', time: null, color: '#ff6a3d',
    path: 'Arises in the lower abdomen, emerges at the perineum and the tip of the coccyx (GV1), ascends the spine to the nape (GV16), enters the brain, rises over the vertex (GV20) and forehead, descends the nose to the philtrum (GV26) and ends inside the upper lip at the gum (GV28).',
    fn: 'The "Sea of the Yang channels": governs all yang channels, the spine, the brain and marrow, and the yang qi of the body. Opened by SI3, paired with BL62.' },
];

// Classical circulation (horary) order of the twelve primary channels
export const FLOW = ['LU', 'LI', 'ST', 'SP', 'HT', 'SI', 'BL', 'KI', 'PC', 'SJ', 'GB', 'LR'];

// Stroke overrides for drawing pathways (point numbers in order)
const rng = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
export const STROKES = {
  ST: [rng(1, 8), [5].concat(rng(9, 45))],
  BL: [rng(1, 30), rng(31, 35), [35, 36, 37, 38, 39, 40], rng(41, 54), [54, 36], [40].concat(rng(55, 67))],
};

export const FIVE_SHU_NAMES = { well: 'Jing-Well', spring: 'Ying-Spring', stream: 'Shu-Stream', river: 'Jing-River', sea: 'He-Sea' };
const YIN_SHU_EL = { well: 'Wood', spring: 'Fire', stream: 'Earth', river: 'Metal', sea: 'Water' };
const YANG_SHU_EL = { well: 'Metal', spring: 'Water', stream: 'Wood', river: 'Fire', sea: 'Earth' };
export const FIVE_SHU = {
  LU: [11, 10, 9, 8, 5], LI: [1, 2, 3, 5, 11], ST: [45, 44, 43, 41, 36], SP: [1, 2, 3, 5, 9],
  HT: [9, 8, 7, 4, 3], SI: [1, 2, 3, 5, 8], BL: [67, 66, 65, 60, 40], KI: [1, 2, 3, 7, 10],
  PC: [9, 8, 7, 5, 3], SJ: [1, 2, 3, 6, 10], GB: [44, 43, 41, 38, 34], LR: [1, 2, 3, 4, 8],
};
export const SHU_KEYS = ['well', 'spring', 'stream', 'river', 'sea'];
export const shuElement = (mer, key) => (MERIDIANS.find((m) => m.id === mer).yy === 'Yin' ? YIN_SHU_EL : YANG_SHU_EL)[key];

export const ELEMENTS = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];
export const EL_INFO = {
  Wood: { color: '#3fbf6f', zh: '木', season: 'Spring', climate: 'Wind', sense: 'Eyes', tissue: 'Sinews', emotion: 'Anger', colour: 'Green', taste: 'Sour', organs: ['LR', 'GB'] },
  Fire: { color: '#ff5a5a', zh: '火', season: 'Summer', climate: 'Heat', sense: 'Tongue', tissue: 'Vessels', emotion: 'Joy', colour: 'Red', taste: 'Bitter', organs: ['HT', 'SI', 'PC', 'SJ'] },
  Earth: { color: '#e6b84a', zh: '土', season: 'Late summer', climate: 'Dampness', sense: 'Mouth', tissue: 'Muscles', emotion: 'Pensiveness', colour: 'Yellow', taste: 'Sweet', organs: ['SP', 'ST'] },
  Metal: { color: '#c9d3df', zh: '金', season: 'Autumn', climate: 'Dryness', sense: 'Nose', tissue: 'Skin', emotion: 'Grief', colour: 'White', taste: 'Pungent', organs: ['LU', 'LI'] },
  Water: { color: '#4b8cff', zh: '水', season: 'Winter', climate: 'Cold', sense: 'Ears', tissue: 'Bones', emotion: 'Fear', colour: 'Black', taste: 'Salty', organs: ['KI', 'BL'] },
};
export const mother = (el) => ELEMENTS[(ELEMENTS.indexOf(el) + 4) % 5];
export const son = (el) => ELEMENTS[(ELEMENTS.indexOf(el) + 1) % 5];

// Category tables: key -> { name, desc, pts: [codes] }
export const CATEGORIES = {
  yuan: { name: 'Yuan-Source', group: 'Organ points', desc: 'Where the original (Yuan) qi of the organ surfaces and lingers. Used to diagnose and treat the organ itself; on yin channels they coincide with the Shu-Stream point.',
    pts: ['LU9', 'LI4', 'ST42', 'SP3', 'HT7', 'SI4', 'BL64', 'KI3', 'PC7', 'SJ4', 'GB40', 'LR3'] },
  luo: { name: 'Luo-Connecting', group: 'Organ points', desc: 'Where the Luo vessel branches off to link a channel with its interior-exterior partner. Used for conditions of both paired channels and for the Luo vessel\'s own symptoms. Includes the Great Luo of the Spleen (SP21).',
    pts: ['LU7', 'LI6', 'ST40', 'SP4', 'HT5', 'SI7', 'BL58', 'KI4', 'PC6', 'SJ5', 'GB37', 'LR5', 'CV15', 'GV1', 'SP21'] },
  xi: { name: 'Xi-Cleft', group: 'Organ points', desc: 'Where qi and blood gather deeply. Used for acute and painful conditions; on yin channels also for bleeding. Includes the Xi-Cleft points of four extraordinary vessels (KI8, BL59, KI9, GB35).',
    pts: ['LU6', 'LI7', 'ST34', 'SP8', 'HT6', 'SI6', 'BL63', 'KI5', 'PC4', 'SJ7', 'GB36', 'LR6', 'KI8', 'BL59', 'KI9', 'GB35'] },
  mu: { name: 'Front-Mu', group: 'Organ points', desc: 'Collecting points on the chest and abdomen where the qi of each organ gathers. Tender on palpation in organ disorders; especially used for Fu (yang) organs and acute conditions.',
    pts: ['LU1', 'ST25', 'CV12', 'LR13', 'CV14', 'CV4', 'CV3', 'GB25', 'CV17', 'CV5', 'GB24', 'LR14'], map: { LU1: 'LU', ST25: 'LI', CV12: 'ST', LR13: 'SP', CV14: 'HT', CV4: 'SI', CV3: 'BL', GB25: 'KI', CV17: 'PC', CV5: 'SJ', GB24: 'GB', LR14: 'LR' } },
  shu: { name: 'Back-Shu', group: 'Organ points', desc: 'Transporting points on the Bladder channel, 1.5 cun from the spine, where the qi of each organ is infused. Especially used for Zang (yin) organs and chronic conditions.',
    pts: ['BL13', 'BL25', 'BL21', 'BL20', 'BL15', 'BL27', 'BL28', 'BL23', 'BL14', 'BL22', 'BL19', 'BL18'], map: { BL13: 'LU', BL25: 'LI', BL21: 'ST', BL20: 'SP', BL15: 'HT', BL27: 'SI', BL28: 'BL', BL23: 'KI', BL14: 'PC', BL22: 'SJ', BL19: 'GB', BL18: 'LR' } },
  lowerhe: { name: 'Lower He-Sea', group: 'Organ points', desc: 'The six yang (Fu) organs each have a He-Sea point on the leg that directly treats the organ, especially in acute conditions.',
    pts: ['ST36', 'ST37', 'ST39', 'BL40', 'BL39', 'GB34'], map: { ST36: 'ST', ST37: 'LI', ST39: 'SI', BL40: 'BL', BL39: 'SJ', GB34: 'GB' } },
  well: { name: 'Jing-Well', group: 'Five Shu (transporting)', desc: 'At the tips of the fingers and toes, where qi "bubbles up" like a spring. Used to revive consciousness, clear heat and for disorders at the opposite end of the channel.', pts: [] },
  spring: { name: 'Ying-Spring', group: 'Five Shu (transporting)', desc: 'Where qi "glides" like a stream. Classically used for febrile disease and to clear heat.', pts: [] },
  stream: { name: 'Shu-Stream', group: 'Five Shu (transporting)', desc: 'Where qi "pours" and begins to deepen. Used for heaviness and joint pain; on yin channels it is also the Yuan-Source point.', pts: [] },
  river: { name: 'Jing-River', group: 'Five Shu (transporting)', desc: 'Where qi "flows" like a river. Used for cough, asthma, alternating chills and fever, and disorders of the voice.', pts: [] },
  sea: { name: 'He-Sea', group: 'Five Shu (transporting)', desc: 'At the elbows and knees, where qi "unites" with the sea and goes deep. Used for rebellious qi, diarrhoea and disorders of the Stomach and Fu organs.', pts: [] },
  tonify: { name: 'Tonification (mother)', group: 'Five Shu (transporting)', desc: 'The Five-Shu point whose phase is the "mother" of the channel\'s own phase — needled to tonify a deficient channel (Nan Jing chapter 69).', pts: [] },
  sedate: { name: 'Sedation (son)', group: 'Five Shu (transporting)', desc: 'The Five-Shu point whose phase is the "son" of the channel\'s own phase — needled to reduce an excess channel.', pts: [] },
  horary: { name: 'Horary (phase) point', group: 'Five Shu (transporting)', desc: 'The point whose phase matches the channel\'s own phase, considered especially potent during the channel\'s two-hour period.', pts: [] },
  influential: { name: 'Eight Influential (Hui-Meeting)', group: 'Special groups', desc: 'Points that have a special influence on a tissue or substance of the whole body.',
    pts: ['LR13', 'CV12', 'CV17', 'BL17', 'GB34', 'LU9', 'BL11', 'GB39'], map: { LR13: 'Zang organs', CV12: 'Fu organs', CV17: 'Qi', BL17: 'Blood', GB34: 'Sinews', LU9: 'Vessels', BL11: 'Bones', GB39: 'Marrow' } },
  confluent: { name: 'Eight Confluent (Opening)', group: 'Special groups', desc: 'The points on the limbs that open each of the eight extraordinary vessels. They are used in classical pairs (master–couple).',
    pts: ['SP4', 'PC6', 'SI3', 'BL62', 'LU7', 'KI6', 'GB41', 'SJ5'], map: { SP4: 'Chong Mai (with PC6)', PC6: 'Yin Wei Mai (with SP4)', SI3: 'Du Mai (with BL62)', BL62: 'Yang Qiao Mai (with SI3)', LU7: 'Ren Mai (with KI6)', KI6: 'Yin Qiao Mai (with LU7)', GB41: 'Dai Mai (with SJ5)', SJ5: 'Yang Wei Mai (with GB41)' } },
  command: { name: 'Command points', group: 'Special groups', desc: 'The four (later six) command points, each governing an area of the body.',
    pts: ['ST36', 'BL40', 'LU7', 'LI4', 'PC6', 'GV26'], map: { ST36: 'Abdomen', BL40: 'Back', LU7: 'Head and neck', LI4: 'Face and mouth', PC6: 'Chest', GV26: 'Resuscitation' } },
  window: { name: 'Window of Heaven', group: 'Special groups', desc: 'Ten points mostly around the neck that regulate the flow of qi between the body and the head; used for rebellious qi, goitre, sudden loss of senses and emotional disconnection.',
    pts: ['ST9', 'LI18', 'SJ16', 'BL10', 'LU3', 'CV22', 'SI16', 'SI17', 'GV16', 'PC1'] },
  seas: { name: 'Four Seas', group: 'Special groups', desc: 'Points of the Sea of Qi (ST9, CV17, GV14, GV15), Sea of Blood (BL11, ST37, ST39), Sea of Water and Grain (ST30, ST36) and Sea of Marrow (GV20, GV16) — Ling Shu chapter 33.',
    pts: ['ST9', 'CV17', 'GV14', 'GV15', 'BL11', 'ST37', 'ST39', 'ST30', 'ST36', 'GV20', 'GV16'], map: { ST9: 'Sea of Qi', CV17: 'Sea of Qi', GV14: 'Sea of Qi', GV15: 'Sea of Qi', BL11: 'Sea of Blood', ST37: 'Sea of Blood', ST39: 'Sea of Blood', ST30: 'Sea of Water & Grain', ST36: 'Sea of Water & Grain', GV20: 'Sea of Marrow', GV16: 'Sea of Marrow' } },
  ghost: { name: 'Sun Si-miao\'s 13 Ghost points', group: 'Special groups', desc: 'Thirteen points described by Sun Si-miao (7th century) for mania, epilepsy and severe mental disturbance.',
    pts: ['GV26', 'LU11', 'SP1', 'PC7', 'BL62', 'GV16', 'ST6', 'CV24', 'PC8', 'GV23', 'CV1', 'LI11', 'EX-HN11'] },
  star: { name: 'Ma Dan-yang\'s 12 Heavenly Star', group: 'Special groups', desc: 'Twelve points considered by Ma Dan-yang (12th century) to be the most important of the body.',
    pts: ['ST36', 'ST44', 'LI11', 'LI4', 'BL40', 'BL57', 'BL60', 'GB30', 'GB34', 'HT5', 'LU7', 'LR3'] },
  entry: { name: 'Entry points', group: 'Channel flow', desc: 'Where qi enters a channel from the previous channel in the circulation sequence.',
    pts: ['LU1', 'LI4', 'ST1', 'SP1', 'HT1', 'SI1', 'BL1', 'KI1', 'PC1', 'SJ1', 'GB1', 'LR1'] },
  exit: { name: 'Exit points', group: 'Channel flow', desc: 'Where qi leaves a channel to pass to the next one in the circulation sequence.',
    pts: ['LU7', 'LI20', 'ST42', 'SP21', 'HT9', 'SI19', 'BL67', 'KI22', 'PC8', 'SJ22', 'GB41', 'LR14'] },
  pregnancy: { name: 'Caution in pregnancy', group: 'Safety', desc: 'Points classically contraindicated or used with great care during pregnancy. Always follow professional training and local regulations.',
    pts: ['LI4', 'SP6', 'BL60', 'BL67', 'GB21', 'CV3', 'CV4', 'CV5', 'CV6', 'CV7', 'BL31', 'BL32', 'BL33', 'BL34', 'KI1', 'CV1'] },
  danger: { name: 'Anatomical caution', group: 'Safety', desc: 'Points over the lung apex, major vessels, the eye or the medulla that require precise, shallow or angled needling.',
    pts: ['LU1', 'LU2', 'ST12', 'GB21', 'PC1', 'HT1', 'ST9', 'ST1', 'BL1', 'GV15', 'GV16', 'CV22', 'EX-HN7', 'CV8', 'ST17'] },
};
for (const id in FIVE_SHU) {
  const m = MERIDIANS.find((x) => x.id === id);
  FIVE_SHU[id].forEach((n, i) => {
    const key = SHU_KEYS[i];
    const code = id + n;
    CATEGORIES[key].pts.push(code);
    const el = shuElement(id, key);
    if (el === mother(m.el)) CATEGORIES.tonify.pts.push(code);
    if (el === son(m.el)) CATEGORIES.sedate.pts.push(code);
    if (el === m.el) CATEGORIES.horary.pts.push(code);
  });
}

// Extraordinary vessels without their own points: pathways through crossing points (bilateral)
export const VESSELS = [
  { id: 'chong', name: 'Chong Mai', en: 'Penetrating Vessel', zh: '冲脉', color: '#ff9e3d', opening: 'SP4', couple: 'PC6',
    pts: ['CV1', 'ST30', 'KI11', 'KI12', 'KI13', 'KI14', 'KI15', 'KI16', 'KI17', 'KI18', 'KI19', 'KI20', 'KI21'],
    desc: 'The "Sea of Blood" and "Sea of the Twelve Channels". Arises in the uterus/lower abdomen, emerges at CV1 and ST30, ascends with the Kidney channel and disperses in the chest; branches go to the throat, face and down the inner leg to the big toe. Governs menstruation, blood and rebellious qi.' },
  { id: 'dai', name: 'Dai Mai', en: 'Girdling Vessel', zh: '带脉', color: '#d6e04f', opening: 'GB41', couple: 'SJ5',
    pts: ['LR13', 'GB26', 'GB27', 'GB28'],
    desc: 'The only horizontal channel: encircles the waist like a belt, binding all the vertical channels. Used for leucorrhoea, dampness in the lower jiao, hip and waist problems, and imbalances between upper and lower body.' },
  { id: 'yinqiao', name: 'Yin Qiao Mai', en: 'Yin Heel Vessel', zh: '阴跷脉', color: '#a68bff', opening: 'KI6', couple: 'LU7',
    pts: ['KI2', 'KI6', 'KI8', 'ST12', 'ST9', 'BL1'],
    desc: 'Starts below the medial malleolus, ascends the inner leg to the genitals, chest, throat and inner canthus. Balances yin and yang on the left/right and medial/lateral sides; governs closing of the eyes and sleep (excess yin → somnolence).' },
  { id: 'yangqiao', name: 'Yang Qiao Mai', en: 'Yang Heel Vessel', zh: '阳跷脉', color: '#ff7c7c', opening: 'BL62', couple: 'SI3',
    pts: ['BL62', 'BL61', 'BL59', 'GB29', 'SI10', 'LI15', 'LI16', 'ST4', 'ST3', 'ST1', 'BL1', 'GB20'],
    desc: 'Starts below the lateral malleolus, ascends the lateral leg, hip, back of the shoulder and face to the inner canthus, then over the head to the nape. Governs opening of the eyes and wakefulness; used for insomnia, epilepsy and lateral muscle tension.' },
  { id: 'yinwei', name: 'Yin Wei Mai', en: 'Yin Linking Vessel', zh: '阴维脉', color: '#5fd0ff', opening: 'PC6', couple: 'SP4',
    pts: ['KI9', 'SP13', 'SP15', 'SP16', 'LR14', 'CV22', 'CV23'],
    desc: 'Links all the yin channels. Starts at KI9, ascends the medial leg and abdomen to the chest and throat. Used for heart pain, chest oppression, anxiety and blood deficiency.' },
  { id: 'yangwei', name: 'Yang Wei Mai', en: 'Yang Linking Vessel', zh: '阳维脉', color: '#ffc4e0', opening: 'SJ5', couple: 'GB41',
    pts: ['BL63', 'GB35', 'SI10', 'SJ15', 'GB21', 'GB20', 'GB19', 'GB18', 'GB17', 'GB16', 'GB15', 'GB14', 'GB13', 'GV16', 'GV15'],
    desc: 'Links all the yang channels. Starts at BL63, ascends the lateral leg and body to the shoulder, over the side of the head to the forehead and back to the nape. Used for exterior conditions, chills and fever, and lateral headaches.' },
];

// Notable crossing (intersection) points
export const CROSSINGS = {
  LU1: 'SP', LI14: 'SI, BL, Yang Wei', LI15: 'Yang Qiao', LI16: 'Yang Qiao', LI20: 'ST', ST1: 'Ren, Yang Qiao', ST4: 'LI, Ren, Yang Qiao', ST7: 'GB', ST8: 'GB, Yang Wei', ST12: 'Yin Qiao', ST30: 'Chong',
  SP6: 'LR, KI', SP12: 'LR', SP13: 'LR, Yin Wei', SP15: 'Yin Wei', SP16: 'Yin Wei', SI10: 'Yang Wei, Yang Qiao', SI12: 'LI, SJ, GB', SI18: 'SJ', SI19: 'SJ, GB',
  BL1: 'SI, ST, Yin Qiao, Yang Qiao', BL11: 'SI, SJ, GB, Du', BL12: 'Du', BL59: 'Yang Qiao (Xi-Cleft)', BL61: 'Yang Qiao', BL62: 'Yang Qiao', BL63: 'Yang Wei',
  KI2: 'Yin Qiao', KI6: 'Yin Qiao', KI8: 'Yin Qiao', KI9: 'Yin Wei', KI11: 'Chong', KI21: 'Chong', PC1: 'LR, GB, SJ', SJ15: 'GB, Yang Wei', SJ17: 'GB', SJ20: 'GB, SI', SJ22: 'GB, SI',
  GB1: 'SI, SJ', GB13: 'Yang Wei', GB14: 'Yang Wei', GB20: 'SJ, Yang Wei, Yang Qiao', GB21: 'SJ, ST, Yang Wei', GB26: 'Dai', GB27: 'Dai', GB28: 'Dai', GB29: 'Yang Qiao', GB30: 'BL',
  LR13: 'GB, Dai', LR14: 'SP, Yin Wei', CV1: 'Du, Chong', CV2: 'LR', CV3: 'SP, KI, LR', CV4: 'SP, KI, LR', CV12: 'SI, SJ, ST', CV17: 'SP, KI, SI, SJ', CV22: 'Yin Wei', CV23: 'Yin Wei', CV24: 'ST, LI, Du',
  GV1: 'KI, GB, Ren', GV13: 'BL', GV14: 'all six yang channels', GV15: 'Yang Wei', GV16: 'Yang Wei', GV17: 'BL', GV20: 'BL, SJ, GB, LR', GV24: 'BL, ST', GV26: 'LI, ST', GV28: 'Ren, ST',
};

export const CAT_ORDER = ['yuan', 'luo', 'xi', 'mu', 'shu', 'lowerhe', 'well', 'spring', 'stream', 'river', 'sea', 'tonify', 'sedate', 'horary', 'influential', 'confluent', 'command', 'window', 'seas', 'ghost', 'star', 'entry', 'exit', 'pregnancy', 'danger'];
