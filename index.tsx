{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww29200\viewh17820\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import \{ GoogleGenAI, GenerateContentResponse \} from "@google/genai";\
\
// Data Types\
type PartyMusicTrack = \{ date?: string; time?: string; artist: string; track: string \};\
type PartyMusicLineup = \{\
    schedule: PartyMusicTrack[];\
    history: PartyMusicTrack[]; // For last 6 months\
\};\
type PartyPastEventAttendance = \{ eventName: string; date: string; fpAttendees: number \};\
\
type Party = \{\
    id: string;\
    name: string;\
    date: string;\
    imageUrl: string;\
    media: string[];\
    location: string;\
    time: string;\
    dressCode: string;\
    music: string;\
    rating: number; // This is the current average rating\
    currentViewers: number; // Current people in party (non-FP specific)\
    fpCount: number; // Current FP users in party\
    selectivity: string;\
    monthlyRatings: \{ month: string; year: number; rating: number \}[];\
    comments: \{ id: string; text: string; timestamp: string; anonymousUserHandle: string \}[];\
    totalFacePartyVisitorsEver: number; // New field\
    pastEventsFacePartyAttendance: PartyPastEventAttendance[]; // New field\
    musicLineup: PartyMusicLineup; // New field\
\};\
\
type UserStatistics = \{\
    facelikesSent: number;\
    facelikesReceived: number; \
    facematches: number; \
    byParty: \{ partyName: string; flReceived: number; flSent: number; fm: number \}[];\
    activityOverTime?: \{ period: string, value: number \}[];\
    facelikeSources?: \{ partyName: string, count: number \}[];\
    friendRequestsSentCount?: number;\
    friendRequestsReceivedCount?: number;\
    friendAcceptanceRate?: string;\
\};\
\
type PendingFacelike = \{\
    id: string; \
    userId: string; \
    name: string;\
    profilePic: string;\
    partyId: string;\
    partyName: string;\
    dateReceived: string; \
    message?: string;\
\};\
\
type ConfirmedFacematch = \{\
    matchId: string; \
    userId: string; \
    name: string;\
    profilePic: string;\
    partyId: string;\
    partyName: string;\
    dateMatched: string; \
    conversationId: string;\
\};\
\
type NotificationSettings = \{\
    messages: boolean;\
    facelikes: boolean;\
    facematches: boolean;\
\};\
\
type PrivacySettings = \{\
    hideProfileInPartySearch: boolean; // Hide from general search unless at same party\
    shareGoingOutStatus: boolean; // Share "En soir\'e9e \'e0..." with friends\
\};\
\
type User = \{\
    id: string;\
    name: string;\
    age: number;\
    bio: string;\
    profilePictureUrl: string;\
    coverPhotoUrl?: string; \
    faceMatches: number; \
    faceLikes: number;   \
    favoriteDrink: string;\
    height: string; // Storing as string e.g., "175cm"\
    eyeColor: string;\
    hairColor: string;\
    nationality: string;\
    photos?: string[];\
    statistics: UserStatistics; \
    gender: 'male' | 'female' | 'other';\
    detailedGender?: string; // For LGBT+ identities if gender is 'other'\
    country: string;\
    profilePic: string; \
    isFaceliked?: boolean; \
    \
    friends: string[]; \
    friendRequestsReceived: \{ userId: string, name: string, profilePic: string, date: string \}[];\
    friendRequestsSent: string[]; \
    qrCodeData: string; \
    isGoingOut: boolean;\
    goingOutToPartyId?: string;\
    goingOutToPartyName?: string;\
\
    pendingFacelikes: PendingFacelike[]; \
    confirmedFacematches: ConfirmedFacematch[]; \
    privatePreferences: \{ \
        selfDescription: string;\
        partnerDescription: string;\
    \};\
    email: string; \
    phoneNumber: string; \
    password?: string; \
    notificationSettings: NotificationSettings; \
    privacySettings: PrivacySettings; \
\};\
\
type Conversation = \{\
    id: string;\
    userId: string;\
    name: string;\
    lastMessage: string;\
    time: string;\
    unread: number;\
    profilePic: string;\
    partyShare?: \{ partyId: string, partyName: string \}; // For shared party messages\
\};\
\
// Constants for new filter options\
const AGE_RANGES_CONFIG = [\
    \{ label: "18-21", min: 18, max: 21, id: "age-18-21" \},\
    \{ label: "22-24", min: 22, max: 24, id: "age-22-24" \},\
    \{ label: "25-28", min: 25, max: 28, id: "age-25-28" \},\
    \{ label: "29-31", min: 29, max: 31, id: "age-29-31" \},\
    \{ label: "32-34", min: 32, max: 34, id: "age-32-34" \},\
    \{ label: "35-37", min: 35, max: 37, id: "age-35-37" \},\
    \{ label: "38-40", min: 38, max: 40, id: "age-38-40" \},\
    \{ label: "41-43", min: 41, max: 43, id: "age-41-43" \},\
    \{ label: "45-50", min: 45, max: 50, id: "age-45-50" \},\
    \{ label: "50-55", min: 50, max: 55, id: "age-50-55" \},\
    \{ label: "55-60", min: 55, max: 60, id: "age-55-60" \},\
    \{ label: "60+", min: 60, max: Infinity, id: "age-60-plus" \},\
];\
\
const HEIGHT_OPTIONS_CONFIG: \{ label: string; value: string; min: number \}[] = [];\
for (let h = 160; h <= 210; h += 2) \{\
    HEIGHT_OPTIONS_CONFIG.push(\{ label: `$\{h\}cm et plus`, value: `$\{h\}_above`, min: h \});\
\}\
\
\
const LGBT_GENDERS = [\
    "Non-binary", "Transgender Woman", "Transgender Man", "Genderqueer", "Genderfluid",\
    "Agender", "Two-Spirit", "Pangender", "Androgyne", "Intersex", "Demiboy", "Demigirl", "Questioning", "Other"\
];\
\
const EYE_COLORS = [\
    "Amber", "Blue", "Brown", "Gray", "Green", "Hazel", "Red/Violet",\
    "Heterochromia (Complete)", "Heterochromia (Central)", "Heterochromia (Sectoral)", \
    "Variegated (Mixed Colors)", "Black", "Dark Brown", "Light Brown", "Dark Blue", "Light Blue",\
    "Dark Green", "Light Green", "Steel Gray", "Violet", "Pink", "Yellow", "Other"\
];\
\
const HAIR_COLORS = [\
    "Black", "Dark Brown", "Medium Brown", "Light Brown", "Dark Blonde", "Medium Blonde",\
    "Light Blonde", "Platinum Blonde", "Red (Natural)", "Auburn", "Chestnut", "Strawberry Blonde",\
    "Gray", "White", "Salt & Pepper", "Blue (Dyed)", "Pink (Dyed)", "Green (Dyed)", \
    "Purple (Dyed)", "Orange (Dyed)", "Silver (Dyed)", "Rainbow/Multi-color (Dyed)", "Other (Dyed)", "Bald", "Other"\
];\
\
// Helper functions\
function isToday(dateString: string): boolean \{\
    const date = new Date(dateString);\
    const today = new Date();\
    return date.getDate() === today.getDate() &&\
           date.getMonth() === today.getMonth() &&\
           date.getFullYear() === today.getFullYear();\
\}\
\
function ensureStatistics(user: User): UserStatistics \{\
    if (!user.statistics) \{\
        user.statistics = \{\
            facelikesSent: 0,\
            facelikesReceived: 0,\
            facematches: 0,\
            byParty: [],\
            friendRequestsSentCount: 0,\
            friendRequestsReceivedCount: 0,\
            friendAcceptanceRate: "N/A"\
        \};\
    \}\
    if (!user.statistics.byParty) \{\
        user.statistics.byParty = [];\
    \}\
    return user.statistics;\
\}\
\
function formatTimestamp(isoString: string): string \{\
    const date = new Date(isoString);\
    const now = new Date();\
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);\
    const diffMinutes = Math.round(diffSeconds / 60);\
    const diffHours = Math.round(diffMinutes / 60);\
    const diffDays = Math.round(diffHours / 24);\
\
    if (diffSeconds < 60) return `Il y a $\{diffSeconds\} sec`;\
    if (diffMinutes < 60) return `Il y a $\{diffMinutes\} min`;\
    if (diffHours < 24) return `Il y a $\{diffHours\} h`;\
    if (diffDays === 1) return `Hier`; // Simplified as per image\
    if (diffDays < 7) return `Il y a $\{diffDays\} jours`;\
    return `Le $\{date.toLocaleDateString()\}`;\
\}\
\
const MOCK_VERIFICATION_CODE = "123456";\
\
// Mock Data\
let allUsers: User[] = [\
    \{\
        id: "u0", \
        name: "Florian Edouard",\
        age: 24,\
        bio: "Developer #web #software #mobileDev | #graphicdesigner #Artist #fullstackdeveloper",\
        profilePictureUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cHJvZmlsZSUyMHBpY3R1cmV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=120&q=60",\
        profilePic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cHJvZmlsZSUyMHBpY3R1cmV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=70&q=60",\
        coverPhotoUrl: "https://images.unsplash.com/photo-1520034475321-cbe63696469a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cGFydHklMjBjb3ZlcnxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=400&q=60",\
        faceMatches: 0, \
        faceLikes: 0,   \
        favoriteDrink: "Moscow Mule",\
        height: "175cm",\
        eyeColor: "Brown",\
        hairColor: "Dark Brown",\
        nationality: "Fran\'e7aise",\
        photos: [\
            "https://images.unsplash.com/photo-1517423568366-8b83523034fd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8cHJvZmlsZSUyMHBob3RvfGVufDB8fDB8fHww&auto=format&fit=crop&w=80&q=60",\
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cHJvZmlsZSUyMHBob3RvfGVufDB8fDB8fHww&auto=format&fit=crop&w=80&q=60",\
            "https://images.unsplash.com/photo-1521119989659-a83eee488004?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8cHJvZmlsZSUyMHBob3RvfGVufDB8fDB8fHww&auto=format&fit=crop&w=80&q=60",\
        ],\
        statistics: \{\
            facelikesSent: 120,\
            facelikesReceived: 3, \
            facematches: 17, \
            byParty: [\
                \{ partyName: "PARADISE CLUB", flReceived: 2, flSent: 30, fm: 5\}, \
                \{ partyName: "BANANA CLUB", flReceived: 1, flSent: 20, fm: 3\},\
            ],\
            friendRequestsSentCount: 5,\
            friendRequestsReceivedCount: 2,\
            friendAcceptanceRate: "80%"\
        \},\
        gender: "male",\
        country: "France",\
        friends: ["u1", "u3", "u4"], \
        friendRequestsReceived: [ \{ userId: "u2", name: "Alex", profilePic: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=70&q=60", date: new Date().toISOString()\}],\
        friendRequestsSent: ["u8"],\
        qrCodeData: "faceparty_user_u0_florian_edouard",\
        isGoingOut: true,\
        goingOutToPartyId: "p1",\
        goingOutToPartyName: "PARADISE CLUB",\
        pendingFacelikes: [\
            \{ \
                id: "pfl1", userId: "u4", name: "Stacy Candice", \
                profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=50&q=60", \
                partyId: "p1", partyName: "PARADISE CLUB", dateReceived: new Date().toISOString(), message: "Can we catchup for Lunch."\
            \},\
            \{ \
                id: "pfl2", userId: "u5", name: "Jeniffer Canning", \
                profilePic: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fHByb2ZpbGV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=50&q=60",\
                partyId: "p2", partyName: "BANANA CLUB", dateReceived: new Date(Date.now() - 86400000 * 2).toISOString(),\
                message: "Good Morning"\
            \},\
            \{ \
                id: "pfl3", userId: "u9", name: "Maria", \
                profilePic: "https://images.unsplash.com/photo-1554151228-14d9def656e4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZmVtYWxlJTIwcHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=70&q=60",\
                partyId: "p1", partyName: "PARADISE CLUB", dateReceived: new Date().toISOString(),\
            \}\
        ],\
        confirmedFacematches: [\
             \{ matchId: "cfm1", userId: "u3", name: "Sophie", profilePic: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=70&q=60", partyId: "p1", partyName: "PARADISE CLUB", dateMatched: new Date(Date.now() - 86400000).toISOString(), conversationId: "chat-u3"\}, \
        ],\
        privatePreferences: \{\
            selfDescription: "Je suis un d\'e9veloppeur passionn\'e9 par les nouvelles technologies, l'art et la musique \'e9lectronique. J'aime les discussions profondes mais aussi m'amuser et danser toute la nuit. Loyal, cr\'e9atif et un peu geek.",\
            partnerDescription: "Je recherche une personne curieuse, ouverte d'esprit, avec un bon sens de l'humour. Quelqu'un qui aime sortir, d\'e9couvrir de nouvelles choses, et qui a des passions. Physiquement, j'appr\'e9cie un style naturel, des yeux expressifs (peu importe la couleur) et un sourire sinc\'e8re. Origine indiff\'e9rente, la connexion est le plus important."\
        \},\
        email: "florian.edouard@example.com",\
        phoneNumber: "+33612345678",\
        password: "password123", // Mock password\
        notificationSettings: \{\
            messages: true,\
            facelikes: true,\
            facematches: true\
        \},\
        privacySettings: \{\
            hideProfileInPartySearch: false,\
            shareGoingOutStatus: true\
        \}\
    \},\
    \{ id: "u1", name: "Camila", age: 23, bio: "Derni\'e8re ann\'e9e de pharma. Invite moi \'e0 danser", profilePic: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=70&q=60", profilePictureUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=120&q=60", gender: "female", country: "France", height: "165cm", favoriteDrink: "Mojito", eyeColor:"Green", hairColor:"Light Blonde", nationality:"Fran\'e7aise", isFaceliked: false, friends: ["u0"], friendRequestsReceived: [], friendRequestsSent: [], qrCodeData: "faceparty_user_u1_camila", isGoingOut: true, goingOutToPartyId: "p1", goingOutToPartyName: "PARADISE CLUB", pendingFacelikes: [], confirmedFacematches: [], faceLikes: 0, faceMatches: 0, statistics: \{ facelikesSent: 0, facelikesReceived: 0, facematches: 0, byParty: []\}, privatePreferences: \{ selfDescription: "\'c9tudiante en pharmacie, j'adore la musique latine et sortir entre amis. Je suis souriante, dynamique et j'aime prendre soin des autres.", partnerDescription: "Je cherche quelqu'un d'amusant, respectueux et qui aime danser. Id\'e9alement plus grand que moi, avec un beau sourire. Peu importe la couleur des cheveux ou des yeux, tant que le feeling passe." \}, email: "camila@example.com", phoneNumber: "+33600000001", notificationSettings: \{ messages: true, facelikes: true, facematches: false \}, privacySettings: \{ hideProfileInPartySearch: false, shareGoingOutStatus: true \} \},\
    \{ id: "u2", name: "Alex", age: 30, bio: "Just here to vibe and meet new people.", profilePic: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=70&q=60", profilePictureUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=120&q=60", gender: "other", detailedGender: "Non-binary", country: "USA", height: "180cm", favoriteDrink: "Bi\'e8re", eyeColor:"Blue", hairColor:"Salt & Pepper", nationality:"Am\'e9ricaine", isFaceliked: false, friends: [], friendRequestsReceived: [], friendRequestsSent: ["u0"], qrCodeData: "faceparty_user_u2_alex", isGoingOut: false, pendingFacelikes: [], confirmedFacematches: [], faceLikes: 0, faceMatches: 0, statistics: \{ facelikesSent: 0, facelikesReceived: 0, facematches: 0, byParty: []\}, privatePreferences: \{ selfDescription: "American guy exploring Paris. Love electronic music, good food, and interesting conversations. Easy-going and adventurous.", partnerDescription: "Looking for someone fun to explore the city with. Open-minded, kind, and ideally speaks some English. Eye color: green or brown. Hair color: brunette." \}, email: "alex@example.com", phoneNumber: "+12025550101", notificationSettings: \{ messages: true, facelikes: true, facematches: true \}, privacySettings: \{ hideProfileInPartySearch: true, shareGoingOutStatus: false \} \},\
    \{ id: "u3", name: "Sophie", age: 21, bio: "Student, loves dancing.", profilePic: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=70&q=60", profilePictureUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=120&q=60", gender: "female", country: "Canada", height: "170cm", favoriteDrink: "Vin rouge", eyeColor:"Hazel", hairColor:"Black", nationality:"Canadienne", isFaceliked: true, friends: ["u0"], friendRequestsReceived: [], friendRequestsSent: [], qrCodeData: "faceparty_user_u3_sophie", isGoingOut: true, goingOutToPartyId: "p2", goingOutToPartyName: "BANANA CLUB", pendingFacelikes: [], confirmedFacematches: [], faceLikes: 0, faceMatches: 0, statistics: \{ facelikesSent: 0, facelikesReceived: 0, facematches: 0, byParty: []\}, privatePreferences: \{ selfDescription: "\'c9tudiante canadienne, passionn\'e9e de danse et de voyages. J'aime rire et d\'e9couvrir de nouvelles cultures. Simple et spontan\'e9e.", partnerDescription: "Cherche un partenaire de danse et d'aventure. Quelqu'un de dr\'f4le, attentionn\'e9, et qui aime les soir\'e9es anim\'e9es. Pr\'e9f\'e9rence pour les cheveux fonc\'e9s et les yeux clairs (bleu ou vert)." \}, email: "sophie@example.ca", phoneNumber: "+15145550102", notificationSettings: \{ messages: false, facelikes: true, facematches: true \}, privacySettings: \{ hideProfileInPartySearch: false, shareGoingOutStatus: true \} \},\
    \{ id: "u4", name: "Stacy Candice", age: 22, bio: "Fashion enthusiast.", profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=70&q=60", profilePictureUrl:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=120&q=60", gender: "female", country: "USA", height: "168cm", favoriteDrink: "Cosmopolitan", eyeColor:"Blue", hairColor:"Platinum Blonde", nationality:"Am\'e9ricaine", isFaceliked: false, friends: ["u0"], friendRequestsReceived: [], friendRequestsSent: [], qrCodeData: "faceparty_user_u4_stacy", isGoingOut: true, goingOutToPartyId: "p1", goingOutToPartyName: "PARADISE CLUB", pendingFacelikes: [], confirmedFacematches: [], faceLikes: 0, faceMatches: 0, statistics: \{ facelikesSent: 0, facelikesReceived: 0, facematches: 0, byParty: []\}, privatePreferences: \{ selfDescription: "Amoureuse de la mode et des sorties entre filles. J'adore la musique pop et les cocktails. Dynamique et toujours partante pour une nouvelle aventure.", partnerDescription: "Je recherche un homme \'e9l\'e9gant, avec du charisme et qui sait me faire rire. Id\'e9alement grand, cheveux ch\'e2tains ou bruns, yeux bleus ou verts. Doit aimer la mode et les belles choses." \}, email: "stacy@example.com", phoneNumber: "+13105550103", notificationSettings: \{ messages: true, facelikes: true, facematches: true \}, privacySettings: \{ hideProfileInPartySearch: false, shareGoingOutStatus: true \} \},\
    \{ id: "u5", name: "Jeniffer Canning", age: 46, bio: "Loves to travel and explore.", profilePic: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fHByb2ZpbGV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=70&q=60", profilePictureUrl:"https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fHByb2ZpbGV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=120&q=60", gender: "female", country: "UK", height: "172cm", favoriteDrink: "Gin Tonic", eyeColor:"Green", hairColor:"Red (Natural)", nationality:"Britannique", isFaceliked: false, friends: [], friendRequestsReceived: [], friendRequestsSent: [], qrCodeData: "faceparty_user_u5_jeniffer", isGoingOut: false, pendingFacelikes: [], confirmedFacematches: [], faceLikes: 0, faceMatches: 0, statistics: \{ facelikesSent: 0, facelikesReceived: 0, facematches: 0, byParty: []\}, privatePreferences: \{ selfDescription: "Globetrotteuse britannique, j'aime l'art, la photographie et les bons vins. Curieuse et ind\'e9pendante.", partnerDescription: "Je cherche quelqu'un d'intelligent, cultiv\'e9, avec qui je peux avoir des conversations int\'e9ressantes. Appr\'e9cie les personnes qui ont voyag\'e9. Physiquement, pas de type pr\'e9cis, mais une belle \'e9nergie est essentielle." \}, email: "jeniffer@example.co.uk", phoneNumber: "+447700900004", notificationSettings: \{ messages: true, facelikes: true, facematches: true \}, privacySettings: \{ hideProfileInPartySearch: false, shareGoingOutStatus: true \} \},\
    \{ id: "u8", name: "David", age: 27, bio: "Tech enthusiast and amateur DJ.", profilePic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8bWFsZSUyMHByb2ZpbGV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=70&q=60", profilePictureUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8bWFsZSUyMHByb2ZpbGV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=120&q=60", gender: "male", country: "UK", height: "178cm", favoriteDrink: "Whiskey", eyeColor:"Green", hairColor:"Auburn", nationality:"Britannique", isFaceliked: false, friends: [], friendRequestsReceived: [], friendRequestsSent: [], qrCodeData: "faceparty_user_u8_david", isGoingOut: true, goingOutToPartyId: "p2", goingOutToPartyName: "BANANA CLUB", pendingFacelikes: [], confirmedFacematches: [], faceLikes: 0, faceMatches: 0, statistics: \{ facelikesSent: 0, facelikesReceived: 0, facematches: 0, byParty: []\}, privatePreferences: \{ selfDescription: "Ing\'e9nieur en tech le jour, DJ amateur la nuit. J'adore la musique house et techno. Calme, observateur et passionn\'e9 par l'innovation.", partnerDescription: "Recherche une femme ind\'e9pendante, qui aime la musique \'e9lectronique et qui n'a pas peur de sortir des sentiers battus. Pr\'e9f\'e9rence pour les brunes aux yeux fonc\'e9s, mais ouverte \'e0 toutes." \}, email: "david@example.co.uk", phoneNumber: "+447700900008", notificationSettings: \{ messages: true, facelikes: true, facematches: true \}, privacySettings: \{ hideProfileInPartySearch: false, shareGoingOutStatus: true \} \},\
    \{ id: "u9", name: "Maria", age: 24, bio: "Traveler and food lover.", profilePic: "https://images.unsplash.com/photo-1554151228-14d9def656e4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZmVtYWxlJTIwcHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=70&q=60", profilePictureUrl: "https://images.unsplash.com/photo-1554151228-14d9def656e4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZmVtYWxlJTIwcHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=120&q=60", gender: "female", country: "Spain", height: "160cm", favoriteDrink: "Sangria", eyeColor:"Brown", hairColor:"Black", nationality:"Espagnole", isFaceliked: false, friends: [], friendRequestsReceived: [], friendRequestsSent: [], qrCodeData: "faceparty_user_u9_maria", isGoingOut: true, goingOutToPartyId: "p1", goingOutToPartyName: "PARADISE CLUB", pendingFacelikes: [], confirmedFacematches: [], faceLikes: 0, faceMatches: 0, statistics: \{ facelikesSent: 0, facelikesReceived: 0, facematches: 0, byParty: []\}, privatePreferences: \{ selfDescription: "Espagnole passionn\'e9e par les voyages, la gastronomie et la photographie. Je suis sociable, joyeuse et j'aime apprendre de nouvelles langues.", partnerDescription: "Cherche quelqu'un d'aventureux, curieux et qui aime bien manger. Pas de crit\'e8re physique strict, mais un bon sens de l'humour est indispensable. Origine indiff\'e9rente." \}, email: "maria@example.es", phoneNumber: "+34600000009", notificationSettings: \{ messages: true, facelikes: true, facematches: true \}, privacySettings: \{ hideProfileInPartySearch: false, shareGoingOutStatus: true \} \},\
];\
\
const currentUserId = "u0"; // Moved declaration before use in ensureUserDetails\
\
function ensureUserDetails(user: User): User \{\
    ensureStatistics(user);\
    if (!user.privatePreferences) \{\
        user.privatePreferences = \{ \
            selfDescription: "Pas encore de description priv\'e9e.", \
            partnerDescription: "Ouvert(e) \'e0 rencontrer de nouvelles personnes." \
        \};\
    \}\
    if (user.gender === 'other' && !user.detailedGender) \{\
        // user.detailedGender = "Non sp\'e9cifi\'e9"; // Or keep undefined\
    \}\
    if (!user.email) user.email = `$\{user.name.toLowerCase().replace(' ', '.')\}@example.com`;\
    if (!user.phoneNumber) user.phoneNumber = `+336$\{Math.floor(10000000 + Math.random() * 90000000)\}`;\
    if (!user.notificationSettings) \{\
        user.notificationSettings = \{ messages: true, facelikes: true, facematches: true \};\
    \}\
    if (!user.privacySettings) \{\
        user.privacySettings = \{ hideProfileInPartySearch: false, shareGoingOutStatus: true \};\
    \}\
    if (!user.password && user.id === currentUserId) user.password = "password123"; // Only for current user for demo\
    return user;\
\}\
\
\
allUsers.forEach(ensureUserDetails);\
\
\
let currentUser = allUsers.find(u => u.id === currentUserId)!;\
\
currentUser.faceLikes = currentUser.pendingFacelikes.length; \
currentUser.faceMatches = currentUser.confirmedFacematches.filter(fm => isToday(fm.dateMatched)).length; \
\
\
const partiesAround: Party[] = [\
    \{ \
        id: "p1", name: "PARADISE CLUB", date: "24 Ao\'fbt", \
        imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGFydHl8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=130&q=60", \
        media: ["https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGFydHl8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1527489377706-592a5a08078d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fHBhcnR5fGVufDB8fDB8fHww&auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fHBhcnR5fGVufDB8fDB8fHww&auto=format&fit=crop&w=400&q=80"], \
        location: "Rue de la paix 10, Paris 1er", time: "18h00-03h00", dressCode: "Tenue d\'e9contract\'e9e", music: "African House Mix & Banana bass", \
        rating: 4.5, currentViewers: 210, fpCount: 42, selectivity: "Entr\'e9e gratuite pour les filles et pour les gar\'e7ons accompagn\'e9s jusqu'\'e0 22h",\
        monthlyRatings: [\
            \{ month: "Jan", year: 2024, rating: 4.2 \},\
            \{ month: "Fev", year: 2024, rating: 4.4 \},\
            \{ month: "Mar", year: 2024, rating: 4.5 \},\
        ],\
        comments: [\
            \{ id: "c1p1", text: "Super ambiance, la musique \'e9tait top !", timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), anonymousUserHandle: "Oiseau de Nuit" \},\
            \{ id: "c2p1", text: "Un peu trop de monde \'e0 mon go\'fbt, mais bonne soir\'e9e quand m\'eame.", timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), anonymousUserHandle: "F\'eatard Discret" \},\
        ],\
        totalFacePartyVisitorsEver: 1250,\
        pastEventsFacePartyAttendance: [\
            \{ eventName: "Summer Kickoff", date: "10 Juin 2024", fpAttendees: 150 \},\
            \{ eventName: "Weekend Grooves", date: "17 Juin 2024", fpAttendees: 180 \},\
            \{ eventName: "Midsummer Night", date: "24 Juin 2024", fpAttendees: 220 \},\
        ],\
        musicLineup: \{\
            schedule: [\
                \{ time: "18:00 - 20:00", artist: "DJ Warmup", track: "Chill Vibes Mix" \},\
                \{ time: "20:00 - 22:00", artist: "DJ Set Electro", track: "Live Set" \},\
                \{ time: "22:00 - 00:00", artist: "DJ African House", track: "Main Set" \},\
                \{ time: "00:00 - 03:00", artist: "DJ Banana Bass", track: "Closing Set" \},\
            ],\
            history: [ // Last 6 months (simplified)\
                \{ date: "2024-07-20", artist: "Guest DJ Mila", track: "Tech House Classics" \},\
                \{ date: "2024-07-13", artist: "Resident DJ Alex", track: "Deep House Grooves" \},\
                \{ date: "2024-06-29", artist: "DJ Afrobeat Special", track: "Afro Rhythms Night" \},\
            ]\
        \}\
    \},\
    \{ \
        id: "p2", name: "BANANA CLUB", date: "25 Ao\'fbt", \
        imageUrl: "https://images.unsplash.com/photo-1527489377706-592a5a08078d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHBhcnR5fGVufDB8fDB8fHww&auto=format&fit=crop&w=130&q=60", \
        media: ["https://images.unsplash.com/photo-1527489377706-592a5a08078d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHBhcnR5fGVufDB8fDB8fHww&auto=format&fit=crop&w=400&q=80"], \
        location: "Rue de Rivoli 64, Paris 1er", time: "19h00-05h00", dressCode: "Chic", music: "Minimal & Drum and Bass", \
        rating: 4.2, currentViewers: 150, fpCount: 30, selectivity: "Payant apr\'e8s 23h",\
        monthlyRatings: [\
            \{ month: "Fev", year: 2024, rating: 4.0 \},\
            \{ month: "Mar", year: 2024, rating: 4.2 \},\
        ],\
        comments: [\
            \{ id: "c1p2", text: "Le DJ \'e9tait incroyable !", timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), anonymousUserHandle: "Explorateur Sonore" \},\
        ],\
        totalFacePartyVisitorsEver: 880,\
        pastEventsFacePartyAttendance: [\
            \{ eventName: "Minimal Monday", date: "08 Juillet 2024", fpAttendees: 90 \},\
            \{ eventName: "DnB Night", date: "15 Juillet 2024", fpAttendees: 120 \},\
        ],\
        musicLineup: \{\
            schedule: [\
                \{ time: "19:00 - 21:00", artist: "DJ Minima", track: "Minimal Set" \},\
                \{ time: "21:00 - 00:00", artist: "DJ Bassline", track: "Drum & Bass Power Hour" \},\
                \{ time: "00:00 - 05:00", artist: "All Stars", track: "B2B Session" \},\
            ],\
            history: [\
                 \{ date: "2024-07-22", artist: "DJ Breaker", track: "Jungle Fever" \},\
            ]\
        \}\
    \},\
    \{ \
        id: "p3", name: "MALL DOLE", date: "26 Ao\'fbt", \
        imageUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fHBhcnR5fGVufDB8fDB8fHww&auto=format&fit=crop&w=130&q=60", \
        media: ["https://images.unsplash.com/photo-1530103862676-de8c9debad1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fHBhcnR5fGVufDB8fDB8fHww&auto=format&fit=crop&w=400&q=80"], \
        location: "Avenue de l'Op\'e9ra 26, Paris 1er", time: "18h00-03h00", dressCode: "Ann\'e9e 90", music: "90s Hits", \
        rating: 4.0, currentViewers: 180, fpCount: 25, selectivity: "Ouvert \'e0 tous",\
        monthlyRatings: [],\
        comments: [],\
        totalFacePartyVisitorsEver: 500,\
        pastEventsFacePartyAttendance: [],\
        musicLineup: \{ schedule: [], history: [] \}\
    \},\
];\
\
const pastParties: Party[] = [\
    \{ id: "p4", name: "VENTURA NIGHT", date: "15 Juil", imageUrl: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8cGFydHl8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=130&q=60", media: ["https://images.unsplash.com/photo-1541532713592-79a0317b6b77?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8cGFydHl8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=400&q=80"], location: "Somewhere Else", time: "15 Juil", dressCode:"", music:"", rating:3.8, currentViewers:0, fpCount:0, selectivity:"", monthlyRatings: [], comments: [], totalFacePartyVisitorsEver: 300, pastEventsFacePartyAttendance: [], musicLineup: \{ schedule: [], history: [] \} \},\
    \{ id: "p5", name: "DRUM AND BASS FEST", date: "02 Juin", imageUrl: "https://images.unsplash.com/photo-1562208472-88759d049f29?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGNsdWJ8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=130&q=60", media: ["https://images.unsplash.com/photo-1562208472-88759d049f29?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGNsdWJ8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=400&q=80"], location: "Another Place", time: "02 Juin", dressCode:"", music:"", rating:4.1, currentViewers:0, fpCount:0, selectivity:"", monthlyRatings: [], comments: [], totalFacePartyVisitorsEver: 450, pastEventsFacePartyAttendance: [], musicLineup: \{ schedule: [], history: [] \} \},\
];\
\
let mockConversations: Conversation[] = [\
    \{ id: "c1", userId: "u6", name: "Ada Thorne", lastMessage: "Alors, quoi de pr\'e9vu ce weekend?;)", time: "15:41", unread: 1, profilePic: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fHByb2ZpbGV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=50&q=60"\},\
    \{ id: "c2", userId: "u7", name: "Manille Verpuis", lastMessage: "Tu as raison, prends ton temps!", time: "12:21", unread: 0, profilePic: "https://images.unsplash.com/photo-1500048993953-d23a436266cf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fHByb2ZpbGV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=50&q=60"\},\
    \{ id: "chat-u3", userId: "u3", name: "Sophie", lastMessage: "Vous avez un nouveau Facematch!", time: "Hier", unread: 0, profilePic: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=70&q=60"\}\
\
];\
\
const anonymousHandles = ["Oiseau de Nuit", "F\'eatard Discret", "Explorateur Sonore", "Visiteur Malin", "Connaisseur Anonyme", "Ambianceur Masqu\'e9"];\
\
function getRandomAnonymousHandle(): string \{\
    return anonymousHandles[Math.floor(Math.random() * anonymousHandles.length)];\
\}\
\
\
// Navigation\
let currentScreenId = 'home-screen';\
let screenHistory: string[] = ['home-screen'];\
let currentPartyContext: Party | null = null; \
let currentViewedParticipantContext: User | null = null;\
let navigationSourceForParticipantProfile: string | null = null; \
let selectedFriendsForPartyShare: string[] = [];\
\
\
// AI Suggestion State\
let currentAiSuggestionType: 'appealsToMe' | 'iAppealTo' | 'mutualMatch' = 'appealsToMe';\
\
// Modal Management\
function showModal(modalId: string) \{\
    const modal = document.getElementById(modalId);\
    if (modal) \{\
        // Clear any previous feedback messages\
        const feedbackEl = modal.querySelector('.modal-feedback');\
        if (feedbackEl) feedbackEl.textContent = '';\
        modal.style.display = 'flex';\
         // Handle party share modal title\
        if (modalId === 'share-party-modal' && currentPartyContext) \{\
            const titleEl = modal.querySelector('#share-party-modal-title');\
            if (titleEl) titleEl.textContent = `Partager $\{currentPartyContext.name\}`;\
        \}\
    \}\
\}\
\
function closeModal(modalId: string) \{\
    const modal = document.getElementById(modalId);\
    if (modal) \{\
        modal.style.display = 'none';\
        // Clear inputs in the modal if needed\
        const inputs = modal.querySelectorAll('input');\
        inputs.forEach(input => \{\
            if (input.type !== 'checkbox' && input.type !== 'radio') \{\
                 input.value = '';\
            \}\
        \});\
        const verificationGroup = modal.querySelector('.form-group[id*="verification-code-group"]');\
        if (verificationGroup) (verificationGroup as HTMLElement).style.display = 'none';\
\
        // Clear feedback in share modal\
        if (modalId === 'share-party-modal') \{\
            const feedbackEl = modal.querySelector('#share-party-feedback');\
            if (feedbackEl) feedbackEl.textContent = '';\
        \}\
    \}\
\}\
\
function navigateTo(screenId: string, context?: any) \{\
    const currentActiveScreen = document.querySelector('.screen.active');\
    if (currentActiveScreen) \{\
        currentActiveScreen.classList.remove('active');\
    \}\
    \
    const nextScreen = document.getElementById(screenId);\
    if (nextScreen) \{\
        nextScreen.classList.add('active');\
        if (screenId !== currentScreenId || screenHistory[screenHistory.length -1] !== screenId) \{\
             screenHistory.push(screenId);\
        \}\
        currentScreenId = screenId;\
        nextScreen.scrollTop = 0;\
        \
        const joinFriendButton = document.getElementById('btn-join-friend-at-party') as HTMLButtonElement;\
        if (joinFriendButton) joinFriendButton.style.display = 'none';\
\
        if (context) \{\
            if (screenId === 'party-details-screen' && context.party) \{\
                renderPartyDetails(context.party, context.joiningFriendName);\
            \} else if (screenId === 'party-participants-screen' && context.party) \{\
                currentPartyContext = context.party; \
                renderPartyParticipants(context.party);\
                const aiEngineArea = document.getElementById('ai-suggestion-engine-area');\
                if (aiEngineArea) aiEngineArea.style.display = 'none';\
                const aiSuggestionsList = document.getElementById('ai-suggestions-list-container');\
                if (aiSuggestionsList) aiSuggestionsList.innerHTML = '';\
                 const btnFinishAISuggestions = document.getElementById('btn-finish-ai-suggestions');\
                if(btnFinishAISuggestions) btnFinishAISuggestions.style.display = 'none';\
\
\
            \} else if (screenId === 'chat-view-screen' && context.conversation) \{\
                renderChatView(context.conversation);\
            \} else if (screenId === 'participant-profile-screen' && context.participant) \{\
                currentViewedParticipantContext = context.participant;\
                navigationSourceForParticipantProfile = context.source || null;\
                renderParticipantProfileScreen(context.participant, navigationSourceForParticipantProfile);\
            \} else if (screenId === 'friends-attending-party-screen' && context.party) \{\
                currentPartyContext = context.party; \
                renderFriendsAttendingPartyScreen(context.party);\
            \} else if (screenId === 'party-rating-evolution-screen' && context.party) \{\
                 currentPartyContext = context.party; \
                renderPartyRatingEvolutionScreen(context.party);\
            \} else if (screenId === 'lineup-details-screen' && context.party) \{\
                currentPartyContext = context.party;\
                renderLineupDetailsScreen(context.party);\
            \} else if (screenId === 'fp-visitors-history-screen' && context.party) \{\
                currentPartyContext = context.party;\
                renderFpVisitorsHistoryScreen(context.party);\
            \} else if (screenId === 'send-party-to-friends-screen' && context.party) \{\
                currentPartyContext = context.party;\
                renderSendPartyToFriendsScreen(context.party);\
            \}\
        \}\
\
        if (screenId === 'profile-screen') renderProfileScreen();\
        if (screenId === 'settings-screen') renderSettingsScreen();\
        if (screenId === 'friends-screen') renderFriendsScreen();\
        if (screenId === 'statistics-screen') renderStatisticsScreen();\
        if (screenId === 'facelikes-screen') renderFacelikesScreen();\
        if (screenId === 'facematches-today-screen') renderFacematchesTodayScreen();\
        if (screenId === 'messaging-screen') renderMessagingScreen();\
        if (screenId === 'new-chat-friends-screen') renderNewChatFriendsScreen();\
        \
        // Settings sub-screens\
        if (screenId === 'notifications-setting-screen') renderNotificationsSettingScreen();\
        if (screenId === 'privacy-setting-screen') renderPrivacySettingScreen();\
        if (screenId === 'account-setting-screen') renderAccountSettingScreen();\
        if (screenId === 'help-setting-screen') renderHelpSettingScreen();\
\
\
    \} else \{\
        console.error(`Screen with id $\{screenId\} not found.`);\
    \}\
\}\
\
function goBack() \{\
    if (screenHistory.length > 1) \{\
        screenHistory.pop(); \
        const previousScreenId = screenHistory[screenHistory.length - 1];\
        let previousContext = \{\};\
         if (previousScreenId === 'party-participants-screen' && currentPartyContext) \{\
             previousContext = \{ party: currentPartyContext \};\
        \} else if (previousScreenId === 'participant-profile-screen' && currentViewedParticipantContext) \{\
             previousContext = \{ participant: currentViewedParticipantContext, source: navigationSourceForParticipantProfile \};\
        \} else if ((previousScreenId === 'party-details-screen' || previousScreenId === 'party-rating-evolution-screen' || previousScreenId === 'lineup-details-screen' || previousScreenId === 'fp-visitors-history-screen') && currentPartyContext) \{\
             previousContext = \{ party: currentPartyContext \};\
        \} \
        navigateTo(previousScreenId, previousContext);\
    \} else \{\
        navigateTo('home-screen'); \
    \}\
\}\
\
\
// Rendering Functions\
function renderHomeScreen() \{\
    (document.getElementById('home-cover-photo') as HTMLImageElement).src = currentUser.coverPhotoUrl!;\
    (document.getElementById('home-profile-pic') as HTMLImageElement).src = currentUser.profilePictureUrl;\
    document.getElementById('home-user-name')!.textContent = `$\{currentUser.name\} \uc0\u10004 `;\
    document.getElementById('home-user-bio')!.textContent = currentUser.bio;\
    \
    currentUser.faceLikes = currentUser.pendingFacelikes.length;\
    currentUser.faceMatches = currentUser.confirmedFacematches.filter(fm => isToday(fm.dateMatched)).length;\
    \
    document.getElementById('home-facematch-count')!.textContent = currentUser.faceMatches.toString();\
    document.getElementById('home-facelike-count')!.textContent = currentUser.faceLikes.toString();\
\
\
    const partiesAroundCarousel = document.getElementById('parties-around-carousel')!;\
    partiesAroundCarousel.innerHTML = partiesAround.map(party => `\
        <div class="party-card" data-party-id="$\{party.id\}">\
            <img src="$\{party.imageUrl\}" alt="$\{party.name\}">\
            <div class="party-card-info">\
                <h3>$\{party.name\}</h3>\
                <p>$\{party.location.split(',')[0]\}</p>\
            </div>\
        </div>\
    `).join('');\
\
    const pastPartiesCarousel = document.getElementById('past-parties-carousel')!;\
    pastPartiesCarousel.innerHTML = pastParties.map(party => `\
        <div class="party-card" data-party-id="$\{party.id\}">\
            <img src="$\{party.imageUrl\}" alt="$\{party.name\}">\
            <div class="party-card-info">\
                <h3>$\{party.name\}</h3>\
                <p>$\{party.time\}</p>\
            </div>\
        </div>\
    `).join('');\
\
    document.querySelectorAll('.party-card').forEach(card => \{\
        card.addEventListener('click', (e) => \{\
            const partyId = (e.currentTarget as HTMLElement).dataset.partyId;\
            const party = [...partiesAround, ...pastParties].find(p => p.id === partyId);\
            if (party) navigateTo('party-details-screen', \{ party \});\
        \});\
    \});\
    \
    const homeProfileTrigger = document.getElementById('home-profile-navigation-trigger');\
    homeProfileTrigger?.addEventListener('click', () => navigateTo('profile-screen'));\
    homeProfileTrigger?.addEventListener('keydown', (e) => \{\
        if (e.key === 'Enter' || e.key === ' ') \{\
            navigateTo('profile-screen');\
        \}\
    \});\
\}\
\
function populateSelect(selectElement: HTMLSelectElement, options: \{label: string, value: string\}[] | string[], currentValue?: string, defaultOptionText?: string) \{\
    selectElement.innerHTML = ''; // Clear existing options\
    if (defaultOptionText) \{\
        const defaultOpt = document.createElement('option');\
        defaultOpt.value = ""; \
        defaultOpt.textContent = defaultOptionText;\
        selectElement.appendChild(defaultOpt);\
    \}\
    options.forEach(opt => \{\
        const option = document.createElement('option');\
        if (typeof opt === 'string') \{\
            option.value = opt;\
            option.textContent = opt;\
        \} else \{ // It's an object \{label, value\}\
            option.value = opt.value;\
            option.textContent = opt.label;\
        \}\
        if (option.value === currentValue) \{\
            option.selected = true;\
        \}\
        selectElement.appendChild(option);\
    \});\
\}\
\
\
let isEditingProfile = false;\
function renderProfileScreen() \{\
    (document.getElementById('profile-main-pic') as HTMLImageElement).src = currentUser.profilePictureUrl;\
    document.getElementById('profile-name-age')!.textContent = `$\{currentUser.name\}, $\{currentUser.age\} ans`;\
    \
    const photoGrid = document.getElementById('profile-photo-grid')!;\
    photoGrid.innerHTML = (currentUser.photos || []).map(photoUrl => `<img src="$\{photoUrl\}" alt="User photo">`).join('');\
\
    const editButton = document.getElementById('edit-profile-info-button')!;\
    \
    const fieldsToEdit = [\
        \{ id: 'profile-favorite-drink', label: 'Boisson Favorite', value: currentUser.favoriteDrink, containerId: 'profile-favorite-drink-container', iconClass: 'fas fa-martini-glass', type: 'text', originalKey: 'favoriteDrink' \},\
        \{ id: 'profile-bio-text', label: 'Bio', value: currentUser.bio, containerId: 'profile-bio-container', type: 'textarea', originalKey: 'bio'\},\
        \{ id: 'profile-height', label: 'Taille', value: currentUser.height, containerId: 'profile-height-container', type: 'text', originalKey: 'height' \}, // Keep as text for now, could be improved\
        \{ id: 'profile-eye-color', label: 'Couleur des yeux', value: currentUser.eyeColor, containerId: 'profile-eye-color-container', type: 'select', originalKey: 'eyeColor', options: EYE_COLORS \},\
        \{ id: 'profile-hair-color', label: 'Couleur des cheveux', value: currentUser.hairColor, containerId: 'profile-hair-color-container', type: 'select', originalKey: 'hairColor', options: HAIR_COLORS \},\
        \{ id: 'profile-nationality', label: 'Nationalit\'e9', value: currentUser.nationality, containerId: 'profile-nationality-container', type: 'text', originalKey: 'nationality' \},\
    ];\
    \
    const privateSelfDescContainer = document.getElementById('profile-private-self-desc-container')!;\
    const privatePartnerDescContainer = document.getElementById('profile-private-partner-desc-container')!;\
    const genderContainer = document.getElementById('profile-gender-container')!;\
    const detailedGenderContainer = document.getElementById('profile-detailed-gender-container')!;\
\
    if (isEditingProfile) \{\
        // Gender editing\
        genderContainer.innerHTML = `\
            <label for="edit-profile-gender">Genre:</label>\
            <select id="edit-profile-gender">\
                <option value="male" $\{currentUser.gender === 'male' ? 'selected' : ''\}>Masculin</option>\
                <option value="female" $\{currentUser.gender === 'female' ? 'selected' : ''\}>F\'e9minin</option>\
                <option value="other" $\{currentUser.gender === 'other' ? 'selected' : ''\}>Autre</option>\
            </select>`;\
        \
        detailedGenderContainer.innerHTML = `\
            <label for="edit-profile-detailed-gender">Genre d\'e9taill\'e9 (si "Autre"):</label>\
            <select id="edit-profile-detailed-gender"></select>`;\
        const detailedGenderSelect = detailedGenderContainer.querySelector('#edit-profile-detailed-gender') as HTMLSelectElement;\
        populateSelect(detailedGenderSelect, LGBT_GENDERS, currentUser.detailedGender, "Choisir...");\
        detailedGenderContainer.style.display = currentUser.gender === 'other' ? 'block' : 'none';\
\
        document.getElementById('edit-profile-gender')?.addEventListener('change', (e) => \{\
            detailedGenderContainer.style.display = (e.target as HTMLSelectElement).value === 'other' ? 'block' : 'none';\
        \});\
\
        fieldsToEdit.forEach(field => \{\
            const container = document.getElementById(field.containerId)!;\
            if (field.type === 'textarea') \{\
                 container.innerHTML = `<label for="edit-$\{field.id\}">$\{field.label\}:</label><textarea id="edit-$\{field.id\}" rows="3">$\{field.value\}</textarea>`;\
            \} else if (field.type === 'select' && field.options) \{\
                container.innerHTML = `<label for="edit-$\{field.id\}">$\{field.label\}:</label><select id="edit-$\{field.id\}"></select>`;\
                populateSelect(container.querySelector('select')!, field.options as string[], field.value);\
            \}\
            else \{ // text input\
                 container.innerHTML = `<label for="edit-$\{field.id\}">$\{field.label\}:</label><input type="text" id="edit-$\{field.id\}" value="$\{field.value\}">`;\
            \}\
        \});\
        privateSelfDescContainer.innerHTML = `<label for="edit-profile-private-self-desc"><strong>Comment je suis (priv\'e9):</strong></label><textarea id="edit-profile-private-self-desc" rows="4" placeholder="D\'e9crivez votre personnalit\'e9...">$\{currentUser.privatePreferences.selfDescription\}</textarea>`;\
        privatePartnerDescContainer.innerHTML = `<label for="edit-profile-private-partner-desc"><strong>Ce que je recherche (priv\'e9):</strong></label><textarea id="edit-profile-private-partner-desc" rows="4" placeholder="D\'e9crivez votre personne id\'e9ale...">$\{currentUser.privatePreferences.partnerDescription\}</textarea>`;\
        editButton.textContent = 'Sauvegarder';\
        editButton.classList.add('save-button'); \
    \} else \{\
        // Display mode\
        genderContainer.innerHTML = `<p><strong>Genre:</strong> <span id="profile-gender-display">$\{currentUser.gender.charAt(0).toUpperCase() + currentUser.gender.slice(1)\}</span></p>`;\
        if (currentUser.gender === 'other' && currentUser.detailedGender) \{\
            detailedGenderContainer.innerHTML = `<p><strong>Genre d\'e9taill\'e9:</strong> <span id="profile-detailed-gender-display">$\{currentUser.detailedGender\}</span></p>`;\
            detailedGenderContainer.style.display = 'block';\
        \} else \{\
            detailedGenderContainer.style.display = 'none';\
        \}\
\
        fieldsToEdit.forEach(field => \{\
            const container = document.getElementById(field.containerId)!;\
            let content = '';\
            if (field.iconClass) \{ // For favorite drink, etc.\
                content = `<i class="$\{field.iconClass\}"></i> <span id="$\{field.id\}">$\{field.value\}</span>`;\
                 if (field.id === 'profile-favorite-drink') \{ // Center only favorite drink\
                    container.innerHTML = content;\
                    container.style.textAlign = 'center';\
                    return; \
                \}\
            \} else if (field.label === 'Bio') \{\
                 content = `<p><strong>$\{field.label\}:</strong> <span id="$\{field.id\}">$\{field.value\}</span></p>`;\
            \} \
            else \{\
                content = `<p><strong>$\{field.label\}:</strong> <span id="$\{field.id\}">$\{field.value\}</span></p>`;\
            \}\
            container.innerHTML = content;\
            container.style.textAlign = 'left'; // Ensure other fields are left-aligned\
        \});\
        privateSelfDescContainer.innerHTML = `<p><strong>Comment je suis (priv\'e9):</strong></p><p class="profile-private-text">$\{currentUser.privatePreferences.selfDescription || "Non d\'e9fini"\}</p>`;\
        privatePartnerDescContainer.innerHTML = `<p><strong>Ce que je recherche (priv\'e9):</strong></p><p class="profile-private-text">$\{currentUser.privatePreferences.partnerDescription || "Non d\'e9fini"\}</p>`;\
        editButton.textContent = 'Modifier les informations';\
        editButton.classList.remove('save-button');\
    \}\
\}\
\
function toggleProfileEdit() \{\
    if (isEditingProfile) \{ \
        // Save Gender\
        const genderInput = document.getElementById('edit-profile-gender') as HTMLSelectElement;\
        currentUser.gender = genderInput.value as 'male' | 'female' | 'other';\
        if (currentUser.gender === 'other') \{\
            const detailedGenderInput = document.getElementById('edit-profile-detailed-gender') as HTMLSelectElement;\
            currentUser.detailedGender = detailedGenderInput.value || undefined;\
        \} else \{\
            currentUser.detailedGender = undefined;\
        \}\
\
        const fieldsToSave = [\
            \{ id: 'profile-favorite-drink', originalKey: 'favoriteDrink' \},\
            \{ id: 'profile-bio-text', originalKey: 'bio' \},\
            \{ id: 'profile-height', originalKey: 'height' \},\
            \{ id: 'profile-eye-color', originalKey: 'eyeColor' \},\
            \{ id: 'profile-hair-color', originalKey: 'hairColor' \},\
            \{ id: 'profile-nationality', originalKey: 'nationality' \},\
        ];\
        fieldsToSave.forEach(field => \{\
            const inputElement = document.getElementById(`edit-$\{field.id\}`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;\
            if (inputElement) \{\
                (currentUser as any)[field.originalKey] = inputElement.value;\
            \}\
        \});\
        // Save private preferences\
        const selfDescInput = document.getElementById('edit-profile-private-self-desc') as HTMLTextAreaElement;\
        const partnerDescInput = document.getElementById('edit-profile-private-partner-desc') as HTMLTextAreaElement;\
        if (selfDescInput) currentUser.privatePreferences.selfDescription = selfDescInput.value;\
        if (partnerDescInput) currentUser.privatePreferences.partnerDescription = partnerDescInput.value;\
\
        isEditingProfile = false;\
        renderHomeScreen(); \
    \} else \{ \
        isEditingProfile = true;\
    \}\
    renderProfileScreen(); \
\}\
\
\
function renderSearchScreen() \{\
    const resultsContainer = document.getElementById('search-results-list')!;\
    resultsContainer.innerHTML = partiesAround.slice(0, 3).map(party => `\
        <div class="search-result-item" data-party-id="$\{party.id\}">\
            <h3>$\{party.name\}</h3>\
            <p><i class="fas fa-map-marker-alt"></i> $\{party.location\}</p>\
            <p><i class="fas fa-clock"></i> $\{party.time\}</p>\
            <p><i class="fas fa-tshirt"></i> $\{party.dressCode\}</p>\
            <p><i class="fas fa-music"></i> $\{party.music\}</p>\
        </div>\
    `).join('');\
     document.querySelectorAll('.search-result-item').forEach(item => \{\
        item.addEventListener('click', (e) => \{\
            const partyId = (e.currentTarget as HTMLElement).dataset.partyId;\
            const party = partiesAround.find(p => p.id === partyId);\
            if (party) navigateTo('party-details-screen', \{ party \});\
        \});\
    \});\
\}\
\
function renderPartyDetails(party: Party, joiningFriendName?: string) \{\
    currentPartyContext = party; \
    document.getElementById('party-details-name')!.textContent = party.name;\
    (document.getElementById('party-details-banner') as HTMLImageElement).src = party.media && party.media.length > 0 ? party.media[0] : party.imageUrl;\
    \
    const mediaGallery = document.getElementById('party-media-gallery')!;\
    if (party.media && party.media.length > 0) \{\
        mediaGallery.innerHTML = party.media.map((mediaUrl: string) => `<img src="$\{mediaUrl\}" alt="Party media">`).join('');\
        mediaGallery.style.display = 'flex';\
    \} else \{\
        mediaGallery.innerHTML = '';\
        mediaGallery.style.display = 'none';\
    \}\
\
    document.getElementById('party-details-title-date')!.textContent = `$\{party.name.toUpperCase()\} - $\{party.time.split('-')[0]\}, $\{party.date\}`;\
    document.getElementById('party-details-address')!.innerHTML = `<i class="fas fa-map-marker-alt"></i> $\{party.location\}`;\
    \
    // Updated "views" to "total FP visitors"\
    const totalFpVisitorsText = document.getElementById('party-details-total-fp-visitors-text')!;\
    totalFpVisitorsText.textContent = `$\{party.totalFacePartyVisitorsEver\} FP Visiteurs (historique)`;\
    const totalFpVisitorsTrigger = document.getElementById('party-details-total-fp-visitors-trigger')!;\
    const newTotalFpVisitorsTrigger = totalFpVisitorsTrigger.cloneNode(true) as HTMLElement;\
    totalFpVisitorsTrigger.parentNode!.replaceChild(newTotalFpVisitorsTrigger, totalFpVisitorsTrigger);\
    newTotalFpVisitorsTrigger.addEventListener('click', () => navigateTo('fp-visitors-history-screen', \{ party \}));\
\
\
    const averageRatingSpan = document.getElementById('party-details-average-rating')!;\
    averageRatingSpan.textContent = `$\{party.rating.toFixed(1)\} / 5`;\
    const ratingTrigger = document.getElementById('party-details-average-rating-trigger')!;\
    const newRatingTrigger = ratingTrigger.cloneNode(true) as HTMLElement; \
    ratingTrigger.parentNode!.replaceChild(newRatingTrigger, ratingTrigger);\
    newRatingTrigger.addEventListener('click', () => navigateTo('party-rating-evolution-screen', \{ party \}));\
\
\
    document.getElementById('party-details-ambiance')!.textContent = party.music;\
    document.getElementById('party-details-dresscode')!.textContent = party.dressCode;\
    document.getElementById('party-details-selectivity')!.textContent = party.selectivity;\
    document.getElementById('party-details-fp-count')!.textContent = party.fpCount.toString();\
\
    const attendingFriends = allUsers.filter(u => \
        currentUser.friends.includes(u.id) &&\
        u.isGoingOut &&\
        u.goingOutToPartyId === party.id\
    );\
    const numberOfAttendingFriends = attendingFriends.length;\
\
    const attendeesShortSpan = document.getElementById('party-details-attendees-short')!;\
    if (numberOfAttendingFriends > 0) \{\
        const friendNames = attendingFriends.map(f => f.name.split(' ')[0]); \
        let namesText = "";\
        if (friendNames.length <= 2) \{ \
            namesText = friendNames.join(', ');\
        \} else \{ \
            namesText = `$\{friendNames.slice(0, 2).join(', ')\}...`;\
        \}\
        attendeesShortSpan.textContent = `$\{namesText\} ($\{numberOfAttendingFriends\} ami$\{numberOfAttendingFriends > 1 ? 's' : ''\})`;\
    \} else \{\
        attendeesShortSpan.textContent = "Aucun de vos amis.";\
    \}\
\
    const attendeesClickableTrigger = document.getElementById('party-details-attendees-clickable-trigger')!;\
    const newAttendeesClickableTrigger = attendeesClickableTrigger.cloneNode(true) as HTMLElement; \
    attendeesClickableTrigger.parentNode!.replaceChild(newAttendeesClickableTrigger, attendeesClickableTrigger);\
    if (numberOfAttendingFriends > 0) \{\
        newAttendeesClickableTrigger.addEventListener('click', () => \{\
            navigateTo('friends-attending-party-screen', \{ party \});\
        \});\
        newAttendeesClickableTrigger.style.cursor = 'pointer';\
    \} else \{\
        newAttendeesClickableTrigger.style.cursor = 'default';\
    \}\
\
\
    const oldJoinPartyButton = document.getElementById('btn-join-party') as HTMLButtonElement;\
    const newJoinPartyButton = oldJoinPartyButton.cloneNode(true) as HTMLButtonElement; \
    oldJoinPartyButton.parentNode!.replaceChild(newJoinPartyButton, oldJoinPartyButton);\
    newJoinPartyButton.addEventListener('click', () => handleJoinParty(party));\
\
    const joinFriendButton = document.getElementById('btn-join-friend-at-party') as HTMLButtonElement;\
    if (joiningFriendName) \{\
        joinFriendButton.textContent = `Rejoindre $\{joiningFriendName\}`;\
        joinFriendButton.style.display = 'block';\
        joinFriendButton.onclick = () => \{\
            alert(`Vous rejoignez $\{joiningFriendName\} \'e0 $\{party.name\}!`);\
            currentUser.isGoingOut = true;\
            currentUser.goingOutToPartyId = party.id;\
            currentUser.goingOutToPartyName = party.name;\
            renderHomeScreen();\
            navigateTo('party-participants-screen', \{ party \});\
        \};\
    \} else \{\
        joinFriendButton.style.display = 'none';\
    \}\
\
    // Share button functionality\
    const shareButton = document.getElementById('party-details-share-button')!;\
    const newShareButton = shareButton.cloneNode(true) as HTMLButtonElement;\
    shareButton.parentNode!.replaceChild(newShareButton, shareButton);\
    newShareButton.addEventListener('click', () => showModal('share-party-modal'));\
\}\
\
function renderPartyComments(party: Party, targetListElementId: string) \{\
    const commentsList = document.getElementById(targetListElementId)!;\
    if (!party.comments || party.comments.length === 0) \{\
        commentsList.innerHTML = "<p>Aucun avis pour le moment. Soyez le premier !</p>";\
        return;\
    \}\
    const sortedComments = [...party.comments].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());\
\
    commentsList.innerHTML = sortedComments.map(comment => `\
        <div class="review-card">\
            <div class="review-card-header">\
                <span class="review-author">$\{comment.anonymousUserHandle\}</span>\
                <span class="review-timestamp">$\{formatTimestamp(comment.timestamp)\}</span>\
            </div>\
            <p class="review-text">$\{comment.text\}</p>\
        </div>\
    `).join('');\
\}\
\
function handlePartyCommentSubmit(party: Party, inputElementId: string, listElementId: string) \{\
    const commentInput = document.getElementById(inputElementId) as HTMLTextAreaElement;\
    const commentText = commentInput.value.trim();\
\
    if (!commentText) \{\
        alert("Veuillez \'e9crire un commentaire.");\
        return;\
    \}\
\
    const newComment = \{\
        id: `cmt-$\{Date.now()\}`,\
        text: commentText,\
        timestamp: new Date().toISOString(),\
        anonymousUserHandle: getRandomAnonymousHandle()\
    \};\
    \
    const partyInAroundIndex = partiesAround.findIndex(p => p.id === party.id);\
    if (partyInAroundIndex > -1) \{\
        partiesAround[partyInAroundIndex].comments.push(newComment);\
    \} else \{\
        const partyInPastIndex = pastParties.findIndex(p => p.id === party.id);\
        if (partyInPastIndex > -1) \{\
             pastParties[partyInPastIndex].comments.push(newComment);\
        \} else \{\
            console.error("Party not found for comment submission in original arrays.");\
            return;\
        \}\
    \}\
     if(currentPartyContext && currentPartyContext.id === party.id) \{\
        currentPartyContext.comments.push(newComment);\
    \}\
\
    renderPartyComments(party, listElementId); \
    commentInput.value = ""; \
\}\
\
function renderPartyRatingEvolutionScreen(party: Party) \{\
    document.getElementById('party-rating-evolution-title')!.textContent = `Avis & \'c9volution - $\{party.name\}`;\
    const monthlyRatingsList = document.getElementById('monthly-ratings-list')!;\
\
    if (!party.monthlyRatings || party.monthlyRatings.length === 0) \{\
        monthlyRatingsList.innerHTML = "<p style='text-align:center; padding: 10px 0; color: var(--text-secondary);'>Aucune donn\'e9e d'\'e9volution des notes disponible.</p>";\
    \} else \{\
        // Sort by year then by month (Jan first)\
        const monthOrder = ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin", "Juil", "Aou", "Sep", "Oct", "Nov", "Dec"];\
        const sortedRatings = [...party.monthlyRatings].sort((a, b) => \{\
            if (a.year !== b.year) return a.year - b.year;\
            return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);\
        \});\
        monthlyRatingsList.innerHTML = sortedRatings.map(mr => `\
            <div class="monthly-rating-item">\
                <span class="month-year">$\{mr.month\} $\{mr.year\}</span>\
                <span class="rating-value">\
                    <i class="fas fa-star"></i> $\{mr.rating.toFixed(1)\} / 5\
                </span>\
            </div>\
        `).join('');\
    \}\
    \
    renderPartyComments(party, 'anonymous-reviews-list');\
\
    const submitCommentButton = document.getElementById('submit-anonymous-review-button')!;\
    // Clone and replace to remove old event listeners if any, then add new one\
    const newSubmitCommentButton = submitCommentButton.cloneNode(true) as HTMLButtonElement; \
    submitCommentButton.parentNode!.replaceChild(newSubmitCommentButton, submitCommentButton);\
    newSubmitCommentButton.addEventListener('click', () => handlePartyCommentSubmit(party, 'new-anonymous-review-input', 'anonymous-reviews-list'));\
\}\
\
\
function renderFriendsAttendingPartyScreen(party: Party) \{\
    document.getElementById('friends-attending-party-title')!.textContent = `Amis \'e0 $\{party.name\}`;\
    const listContainer = document.getElementById('friends-attending-party-list')!;\
\
    const friendsAtParty = allUsers.filter(u =>\
        currentUser.friends.includes(u.id) &&\
        u.isGoingOut &&\
        u.goingOutToPartyId === party.id\
    );\
\
    if (friendsAtParty.length === 0) \{\
        listContainer.innerHTML = "<p class='empty-list-message'>Aucun de vos amis ne participe \'e0 cette soir\'e9e.</p>";\
        return;\
    \}\
\
    listContainer.innerHTML = friendsAtParty.map(friend => `\
        <div class="friend-item friend-attending-item" data-user-id="$\{friend.id\}" role="button" tabindex="0" aria-label="View profile of $\{friend.name\}">\
            <img src="$\{friend.profilePic\}" alt="$\{friend.name\}" class="friend-attending-pic">\
            <span class="friend-attending-name">$\{friend.name\}</span>\
            <i class="fas fa-chevron-right friend-attending-chevron"></i>\
        </div>\
    `).join('');\
\
    listContainer.querySelectorAll('.friend-item.friend-attending-item').forEach(item => \{\
        item.addEventListener('click', () => \{\
            const userId = (item as HTMLElement).dataset.userId;\
            const user = allUsers.find(u => u.id === userId);\
            if (user) \{\
                navigateTo('participant-profile-screen', \{ participant: user, source: 'friends-attending-party' \});\
            \}\
        \});\
    \});\
\}\
\
\
function handleJoinParty(party: Party) \{\
    currentUser.isGoingOut = true;\
    currentUser.goingOutToPartyId = party.id;\
    currentUser.goingOutToPartyName = party.name;\
    renderHomeScreen(); // Update home screen if it shows going out status\
    navigateTo('party-participants-screen', \{ party \});\
\}\
\
function updateSelectedAgeRangesButtonText() \{\
    const ageButton = document.getElementById('filter-age-button') as HTMLButtonElement;\
    const checkboxes = document.querySelectorAll('#filter-age-checkboxes-list input[type="checkbox"]:checked') as NodeListOf<HTMLInputElement>;\
    const selectedLabels = Array.from(checkboxes).map(cb => \{\
        const foundRange = AGE_RANGES_CONFIG.find(r => r.id === cb.id);\
        return foundRange ? foundRange.label : '';\
    \}).filter(Boolean);\
\
    if (selectedLabels.length === 0) \{\
        ageButton.textContent = '\'c2ge (Tous)';\
    \} else if (selectedLabels.length <= 2) \{\
        ageButton.textContent = `\'c2ge ($\{selectedLabels.join(', ')\})`;\
    \} else \{\
        ageButton.textContent = `\'c2ge ($\{selectedLabels.length\} s\'e9lections)`;\
    \}\
\}\
\
\
function renderPartyParticipants(party: Party) \{\
    document.getElementById('participants-party-name')!.textContent = party.name;\
    document.getElementById('participants-total-people')!.textContent = (party.currentViewers || 0).toString();\
    document.getElementById('participants-closing-time')!.textContent = party.time.split('-')[1] || "N/A";\
\
    // Populate filter options if not already done\
    const eyeColorSelect = document.getElementById('filter-eye-color') as HTMLSelectElement;\
    if (eyeColorSelect.options.length <=1 ) \{ // only default "all"\
        populateSelect(eyeColorSelect, EYE_COLORS, undefined, "Yeux (Tous)");\
    \}\
    const hairColorSelect = document.getElementById('filter-hair-color') as HTMLSelectElement;\
     if (hairColorSelect.options.length <=1 ) \{\
        populateSelect(hairColorSelect, HAIR_COLORS, undefined, "Cheveux (Tous)");\
    \}\
    const heightSelect = document.getElementById('filter-height') as HTMLSelectElement;\
    if (heightSelect.options.length <=1) \{\
        populateSelect(heightSelect, HEIGHT_OPTIONS_CONFIG.map(h => (\{label: h.label, value: h.value\})), undefined, "Taille (Toutes)");\
    \}\
\
\
    const ageCheckboxesList = document.getElementById('filter-age-checkboxes-list')!;\
    if (ageCheckboxesList.childElementCount === 0) \{\
        AGE_RANGES_CONFIG.forEach(range => \{\
            const div = document.createElement('div');\
            div.className = 'filter-age-checkbox-item';\
            const checkbox = document.createElement('input');\
            checkbox.type = 'checkbox';\
            checkbox.id = range.id;\
            checkbox.value = range.label;\
            checkbox.addEventListener('change', () => \{\
                updateSelectedAgeRangesButtonText();\
                renderPartyParticipants(party);\
            \});\
            const label = document.createElement('label');\
            label.htmlFor = range.id;\
            label.textContent = range.label;\
            div.appendChild(checkbox);\
            div.appendChild(label);\
            ageCheckboxesList.appendChild(div);\
        \});\
    \}\
    updateSelectedAgeRangesButtonText();\
\
\
    const genderFilter = (document.getElementById('filter-gender') as HTMLSelectElement).value;\
    const specificGenderFilterContainer = document.getElementById('filter-specific-gender-container')!;\
    const specificGenderSelect = document.getElementById('filter-specific-gender') as HTMLSelectElement;\
\
    if (genderFilter === 'other') \{\
        specificGenderFilterContainer.style.display = 'block';\
        if (specificGenderSelect.options.length <=1) \{ // Populate if not already\
             populateSelect(specificGenderSelect, LGBT_GENDERS, undefined, "Tous (Autres)");\
        \}\
    \} else \{\
        specificGenderFilterContainer.style.display = 'none';\
    \}\
    const specificGenderValue = (genderFilter === 'other' && specificGenderSelect.value !== "") ? specificGenderSelect.value : null;\
\
\
    // Get selected age ranges\
    const selectedAgeRanges: string[] = [];\
    document.querySelectorAll('#filter-age-checkboxes-list input[type="checkbox"]:checked').forEach(cb => \{\
        selectedAgeRanges.push((cb as HTMLInputElement).value);\
    \});\
\
    const countryFilter = (document.getElementById('filter-country') as HTMLInputElement).value.toLowerCase();\
    const heightFilterValue = (document.getElementById('filter-height') as HTMLSelectElement).value;\
    const eyeColorFilter = (document.getElementById('filter-eye-color') as HTMLSelectElement).value;\
    const hairColorFilter = (document.getElementById('filter-hair-color') as HTMLSelectElement).value;\
\
\
    let filteredParticipants = allUsers.filter(p => \{\
        if (p.id === currentUser.id) return false; \
        if (!p.isGoingOut || p.goingOutToPartyId !== party.id) return false;\
        if (p.privacySettings.hideProfileInPartySearch && p.goingOutToPartyId !== currentUser.goingOutToPartyId) return false;\
\
        let match = true;\
        if (genderFilter !== 'all') \{\
            if (genderFilter === 'other') \{\
                if (p.gender !== 'other') match = false;\
                if (specificGenderValue && p.detailedGender !== specificGenderValue) match = false;\
            \} else \{\
                if (p.gender !== genderFilter) match = false;\
            \}\
        \}\
        \
        if (selectedAgeRanges.length > 0) \{\
            let ageMatch = false;\
            for (const rangeLabel of selectedAgeRanges) \{\
                const rangeConfig = AGE_RANGES_CONFIG.find(r => r.label === rangeLabel);\
                if (rangeConfig && p.age >= rangeConfig.min && p.age <= rangeConfig.max) \{\
                    ageMatch = true;\
                    break;\
                \}\
            \}\
            if (!ageMatch) match = false;\
        \}\
\
        if (countryFilter && !p.country.toLowerCase().includes(countryFilter)) match = false;\
        \
        if (heightFilterValue !== "" && heightFilterValue !== "all") \{\
            const heightNum = parseInt(p.height); // e.g., "175cm" -> 175\
            const selectedHeightConfig = HEIGHT_OPTIONS_CONFIG.find(hOpt => hOpt.value === heightFilterValue);\
            if (selectedHeightConfig && heightNum < selectedHeightConfig.min) \{\
                match = false;\
            \}\
        \}\
\
        if (eyeColorFilter !== "" && p.eyeColor !== eyeColorFilter) match = false;\
        if (hairColorFilter !== "" && p.hairColor !== hairColorFilter) match = false;\
\
        return match;\
    \});\
\
    document.getElementById('participants-fp-count')!.textContent = filteredParticipants.length.toString();\
\
    const listContainer = document.getElementById('participants-list')!;\
    listContainer.innerHTML = filteredParticipants.map(p => `\
        <div class="participant-card">\
            <div class="participant-card-clickable-area" data-user-id="$\{p.id\}" role="button" tabindex="0" aria-label="View profile of $\{p.name\}">\
                <img src="$\{p.profilePic\}" alt="$\{p.name\}">\
                <div class="participant-info">\
                    <h3>$\{p.name\}, $\{p.age\}</h3>\
                    <p class="drink"><i class="fas fa-cocktail"></i> $\{p.favoriteDrink.toUpperCase()\}</p>\
                    <p class="bio">"$\{p.bio\}"</p>\
                </div>\
            </div>\
            <button class="facelike-button-participant-card $\{p.isFaceliked ? 'liked' : ''\}" data-user-id="$\{p.id\}" aria-label="Facelike $\{p.name\}">\
                <i class="$\{p.isFaceliked ? 'fas' : 'far'\} fa-heart"></i>\
            </button>\
        </div>\
    `).join('');\
    \
    listContainer.querySelectorAll('.participant-card-clickable-area').forEach(card => \{\
        card.addEventListener('click', (e) => \{\
            const userId = (e.currentTarget as HTMLElement).dataset.userId;\
            const participant = allUsers.find(p => p.id === userId);\
            if (participant) navigateTo('participant-profile-screen', \{ participant, source: 'participants-list' \});\
        \});\
        card.addEventListener('keydown', (e) => \{\
            if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') \{\
                const userId = (e.currentTarget as HTMLElement).dataset.userId;\
                const participant = allUsers.find(p => p.id === userId);\
                if (participant) navigateTo('participant-profile-screen', \{ participant, source: 'participants-list' \});\
            \}\
        \});\
    \});\
\
    listContainer.querySelectorAll('.facelike-button-participant-card').forEach(button => \{\
        button.addEventListener('click', (e) => \{\
            const userId = (e.currentTarget as HTMLElement).dataset.userId;\
            toggleFacelike(userId!, 'participants-list');\
        \});\
    \});\
\}\
\
function toggleFacelike(userIdToLike: string, source: 'participants-list' | 'participant-profile' | 'friend-profile') \{\
    const likedUserIndex = allUsers.findIndex(u => u.id === userIdToLike);\
    if (likedUserIndex === -1) return;\
\
    const likedUser = allUsers[likedUserIndex];\
    likedUser.isFaceliked = !likedUser.isFaceliked; \
\
    const currentUserStats = ensureStatistics(currentUser);\
    const likedUserStats = ensureStatistics(likedUser);\
\
    const partyIdForLike = (source === 'participants-list' && currentPartyContext) ? currentPartyContext.id : undefined;\
    const partyNameForLike = (source === 'participants-list' && currentPartyContext) ? currentPartyContext.name : "Profil Direct";\
\
    if (likedUser.isFaceliked) \{ \
        currentUserStats.facelikesSent++;\
\
        const newPendingLike: PendingFacelike = \{\
            id: `pfl-$\{Date.now()\}-$\{Math.random().toString(36).substr(2, 5)\}`,\
            userId: currentUser.id,\
            name: currentUser.name,\
            profilePic: currentUser.profilePic,\
            partyId: partyIdForLike || '', \
            partyName: partyNameForLike,\
            dateReceived: new Date().toISOString(),\
        \};\
        likedUser.pendingFacelikes.push(newPendingLike);\
        likedUser.faceLikes = likedUser.pendingFacelikes.length; \
\
        likedUserStats.facelikesReceived++;\
        let likedUserPartyStat = likedUserStats.byParty.find(p => p.partyName === partyNameForLike);\
        if (likedUserPartyStat) \{\
            likedUserPartyStat.flReceived++;\
        \} else \{\
            likedUserStats.byParty.push(\{ partyName: partyNameForLike, flReceived: 1, flSent: 0, fm: 0 \});\
        \}\
\
        let currentUserPartyStat = currentUserStats.byParty.find(p => p.partyName === partyNameForLike);\
        if (currentUserPartyStat) \{\
            currentUserPartyStat.flSent++;\
        \} else \{\
            currentUserStats.byParty.push(\{ partyName: partyNameForLike, flReceived: 0, flSent: 1, fm: 0 \});\
        \}\
        // Mock notification for the liked user\
        if (likedUser.notificationSettings.facelikes) \{\
            // In a real app, this would be a push notification or in-app badge\
            console.log(`User $\{likedUser.id\} would receive a Facelike notification.`);\
            // alert(`Simulation: $\{likedUser.name\} a \'e9t\'e9 notifi\'e9(e) de votre Facelike !`);\
        \}\
\
\
    \} else \{ \
        const likeToRemoveIndex = likedUser.pendingFacelikes.findIndex(\
            pl => pl.userId === currentUser.id && (pl.partyName === partyNameForLike || (pl.partyId === (partyIdForLike || '')))\
        );\
\
        if (likeToRemoveIndex > -1) \{\
            likedUser.pendingFacelikes.splice(likeToRemoveIndex, 1);\
            likedUser.faceLikes = likedUser.pendingFacelikes.length;\
\
            currentUserStats.facelikesSent = Math.max(0, currentUserStats.facelikesSent - 1);\
            \
            likedUserStats.facelikesReceived = Math.max(0, likedUserStats.facelikesReceived - 1);\
            let likedUserPartyStat = likedUserStats.byParty.find(p => p.partyName === partyNameForLike);\
            if (likedUserPartyStat) \{\
                likedUserPartyStat.flReceived = Math.max(0, likedUserPartyStat.flReceived - 1);\
            \}\
            \
            let currentUserPartyStat = currentUserStats.byParty.find(p => p.partyName === partyNameForLike);\
            if (currentUserPartyStat) \{\
                currentUserPartyStat.flSent = Math.max(0, currentUserPartyStat.flSent - 1);\
            \}\
        \}\
    \}\
\
    if (source === 'participants-list' && currentPartyContext) \{\
        renderPartyParticipants(currentPartyContext);\
    \} else if (source === 'participant-profile' || source === 'friend-profile') \{\
        renderParticipantProfileScreen(likedUser, source);\
    \}\
    renderHomeScreen(); \
    if (currentScreenId === 'statistics-screen') renderStatisticsScreen(); \
\}\
\
\
function renderParticipantProfileScreen(participant: User, source?: string) \{\
    currentViewedParticipantContext = participant; \
    navigationSourceForParticipantProfile = source;\
\
    document.getElementById('participant-profile-name-header')!.textContent = participant.name;\
    (document.getElementById('participant-profile-main-pic') as HTMLImageElement).src = participant.profilePictureUrl || participant.profilePic;\
    document.getElementById('participant-profile-name-age')!.textContent = `$\{participant.name\}, $\{participant.age\} ans`;\
    document.getElementById('participant-profile-drink')!.innerHTML = `<i class="fas fa-cocktail"></i> $\{participant.favoriteDrink || 'N/A'\}`;\
    document.getElementById('participant-profile-bio')!.textContent = `"$\{participant.bio\}"`;\
\
    let genderText = participant.gender.charAt(0).toUpperCase() + participant.gender.slice(1);\
    if (participant.gender === 'other' && participant.detailedGender) \{\
        genderText += ` ($\{participant.detailedGender\})`;\
    \}\
    document.getElementById('participant-profile-gender')!.textContent = genderText;\
    document.getElementById('participant-profile-height')!.textContent = participant.height || 'N/A';\
    document.getElementById('participant-profile-country')!.textContent = participant.country || 'N/A';\
    document.getElementById('participant-profile-eye-color')!.textContent = participant.eyeColor || 'N/A';\
    document.getElementById('participant-profile-hair-color')!.textContent = participant.hairColor || 'N/A';\
\
\
    const facelikeButtonHeader = document.getElementById('participant-profile-facelike-button-header')!;\
    const facelikeButtonMain = document.getElementById('participant-profile-facelike-button-main')!;\
    \
    [facelikeButtonHeader, facelikeButtonMain].forEach(btn => \{\
        btn.innerHTML = participant.isFaceliked \
            ? `<i class="fas fa-heart"></i> Faceliked`\
            : `<i class="far fa-heart"></i> Facelike`;\
        btn.classList.toggle('liked', !!participant.isFaceliked);\
        \
        const newBtn = btn.cloneNode(true) as HTMLElement;\
        btn.parentNode?.replaceChild(newBtn, btn);\
        newBtn.addEventListener('click', () => toggleFacelike(participant.id, 'participant-profile'));\
    \});\
\
    const addFriendButton = document.getElementById('participant-profile-add-friend-button') as HTMLButtonElement;\
    const removeFriendButton = document.getElementById('participant-profile-remove-friend-button') as HTMLButtonElement;\
\
    const isFriend = currentUser.friends.includes(participant.id);\
    const hasSentRequest = currentUser.friendRequestsSent.includes(participant.id);\
    const hasReceivedRequest = currentUser.friendRequestsReceived.some(req => req.userId === participant.id);\
\
    if (isFriend) \{\
        addFriendButton.style.display = 'none';\
        removeFriendButton.style.display = 'block';\
        removeFriendButton.onclick = () => \{\
            if (confirm(`Voulez-vous vraiment retirer $\{participant.name\} de vos amis ?`)) \{\
                removeFriend(participant.id);\
                renderParticipantProfileScreen(participant, source); \
            \}\
        \};\
    \} else if (hasSentRequest) \{\
        addFriendButton.style.display = 'block';\
        addFriendButton.textContent = 'Demande envoy\'e9e';\
        addFriendButton.disabled = true;\
        removeFriendButton.style.display = 'none';\
    \} else if (hasReceivedRequest) \{\
        addFriendButton.style.display = 'block';\
        addFriendButton.textContent = 'R\'e9pondre \'e0 la demande';\
        addFriendButton.disabled = false;\
        addFriendButton.onclick = () => navigateTo('friends-screen');\
        removeFriendButton.style.display = 'none';\
    \} else \{\
        addFriendButton.style.display = 'block';\
        addFriendButton.textContent = 'Ajouter comme ami';\
        addFriendButton.disabled = false;\
        addFriendButton.onclick = () => sendFriendRequest(participant.id);\
        removeFriendButton.style.display = 'none';\
    \}\
    const goingOutStatusEl = document.getElementById('participant-profile-going-out-status')!;\
    if (isFriend && participant.isGoingOut && participant.goingOutToPartyName && participant.privacySettings.shareGoingOutStatus) \{\
        goingOutStatusEl.innerHTML = `<i class="fas fa-glass-cheers"></i> En soir\'e9e \'e0: <span class="link-lookalike" data-party-id="$\{participant.goingOutToPartyId\}">$\{participant.goingOutToPartyName\}</span>`;\
        goingOutStatusEl.style.display = 'block';\
        goingOutStatusEl.querySelector('.link-lookalike')?.addEventListener('click', (e) => \{\
            const partyId = (e.target as HTMLElement).dataset.partyId;\
            const party = [...partiesAround, ...pastParties].find(p => p.id === partyId);\
            if (party) navigateTo('party-details-screen', \{ party, joiningFriendName: participant.name \});\
        \});\
    \} else \{\
        goingOutStatusEl.style.display = 'none';\
    \}\
\}\
\
\
function renderFacelikesScreen() \{\
    const listContainer = document.getElementById('facelikes-list')!;\
    const todaysPendingLikes = currentUser.pendingFacelikes.filter(fl => isToday(fl.dateReceived));\
\
    if (todaysPendingLikes.length === 0) \{\
        listContainer.innerHTML = "<p class='empty-list-message'>Aucun facelike re\'e7u aujourd'hui.</p>";\
        return;\
    \}\
\
    const likesByParty: \{ [key: string]: PendingFacelike[] \} = todaysPendingLikes.reduce((acc, like) => \{\
        (acc[like.partyName] = acc[like.partyName] || []).push(like);\
        return acc;\
    \}, \{\} as \{ [key: string]: PendingFacelike[] \});\
\
    listContainer.innerHTML = Object.entries(likesByParty).map(([partyName, likes]) => `\
        <div class="party-group">\
            <h3 class="party-group-header">$\{partyName\} ($\{likes.length\})</h3>\
            <div class="item-list-by-party">\
                $\{likes.map(fl => `\
                    <div class="facelike-item" data-like-id="$\{fl.id\}">\
                        <img src="$\{fl.profilePic\}" alt="$\{fl.name\}">\
                        <div class="facelike-info">\
                            <h3>$\{fl.name\}</h3>\
                            $\{fl.message ? `<p>$\{fl.message\}</p>` : ''\}\
                        </div>\
                        <button class="accept-facelike-button" data-like-id="$\{fl.id\}" data-user-id="$\{fl.userId\}" aria-label="Accept Facelike from $\{fl.name\}">Accepter</button>\
                    </div>\
                `).join('')\}\
            </div>\
        </div>\
    `).join('');\
\
    document.querySelectorAll('.accept-facelike-button').forEach(button => \{\
        button.addEventListener('click', (e) => \{\
            const likeId = (e.currentTarget as HTMLElement).dataset.likeId;\
            const likedByUserId = (e.currentTarget as HTMLElement).dataset.userId;\
\
            const pendingLikeIndex = currentUser.pendingFacelikes.findIndex(fl => fl.id === likeId);\
            if (pendingLikeIndex === -1 || !likedByUserId) return;\
\
            const acceptedLike = currentUser.pendingFacelikes[pendingLikeIndex];\
            \
            const newMatch: ConfirmedFacematch = \{\
                matchId: `cfm-$\{Date.now()\}`,\
                userId: likedByUserId,\
                name: acceptedLike.name,\
                profilePic: acceptedLike.profilePic,\
                partyId: acceptedLike.partyId,\
                partyName: acceptedLike.partyName,\
                dateMatched: new Date().toISOString(),\
                conversationId: `chat-$\{likedByUserId\}`\
            \};\
            currentUser.confirmedFacematches.push(newMatch);\
\
            currentUser.pendingFacelikes.splice(pendingLikeIndex, 1);\
            \
            const currentUserStats = ensureStatistics(currentUser);\
            currentUserStats.facematches++;\
            let partyStat = currentUserStats.byParty.find(p => p.partyName === acceptedLike.partyName);\
            if (partyStat) \{\
                partyStat.fm++;\
            \} else \{\
                currentUserStats.byParty.push(\{ partyName: acceptedLike.partyName, flReceived: 0, flSent: 0, fm: 1 \});\
            \}\
            \
            currentUser.faceLikes = currentUser.pendingFacelikes.length;\
            currentUser.faceMatches = currentUser.confirmedFacematches.filter(fm => isToday(fm.dateMatched)).length;\
\
            const conversation: Conversation = \{\
                id: newMatch.conversationId,\
                userId: likedByUserId,\
                name: acceptedLike.name,\
                profilePic: acceptedLike.profilePic,\
                lastMessage: "Vous avez un nouveau Facematch!",\
                time: "Maintenant",\
                unread: 1 \
            \};\
            if(!mockConversations.find(c => c.userId === likedByUserId)) \{\
                mockConversations.unshift(conversation); \
            \}\
            \
            // Mock notification for current user about new match\
            if (currentUser.notificationSettings.facematches) \{\
                 // alert(`Simulation: Vous avez un nouveau Facematch avec $\{acceptedLike.name\} !`);\
                 console.log(`User $\{currentUser.id\} would receive a Facematch notification for match with $\{acceptedLike.name\}.`);\
            \}\
\
\
            renderHomeScreen(); \
            renderFacelikesScreen(); \
            if(currentScreenId === 'statistics-screen') renderStatisticsScreen();\
            renderMessagingScreen(); \
            navigateTo('chat-view-screen', \{ conversation \});\
        \});\
    \});\
\}\
\
function renderFacematchesTodayScreen() \{\
    const listContainer = document.getElementById('facematches-today-list')!;\
    const todaysMatches = currentUser.confirmedFacematches.filter(fm => isToday(fm.dateMatched));\
\
    if (todaysMatches.length === 0) \{\
        listContainer.innerHTML = "<p class='empty-list-message'>Aucun facematch aujourd'hui.</p>";\
        return;\
    \}\
\
    const matchesByParty: \{ [key: string]: ConfirmedFacematch[] \} = todaysMatches.reduce((acc, match) => \{\
        (acc[match.partyName] = acc[match.partyName] || []).push(match);\
        return acc;\
    \}, \{\} as \{ [key: string]: ConfirmedFacematch[] \});\
\
    listContainer.innerHTML = Object.entries(matchesByParty).map(([partyName, matches]) => `\
        <div class="party-group">\
            <h3 class="party-group-header">$\{partyName\} ($\{matches.length\})</h3>\
            <div class="item-list-by-party">\
                $\{matches.map(fm => `\
                    <div class="facematch-item" data-match-id="$\{fm.matchId\}">\
                        <img src="$\{fm.profilePic\}" alt="$\{fm.name\}">\
                        <div class="facematch-info">\
                            <h3>Match avec $\{fm.name\}</h3>\
                            <p>Le $\{new Date(fm.dateMatched).toLocaleTimeString([], \{ hour: '2-digit', minute: '2-digit' \})\}</p>\
                        </div>\
                        <button class="view-chat-button" data-conversation-id="$\{fm.conversationId\}" data-user-id="$\{fm.userId\}" aria-label="Message $\{fm.name\}">Message</button>\
                    </div>\
                `).join('')\}\
            </div>\
        </div>\
    `).join('');\
\
    document.querySelectorAll('.view-chat-button').forEach(button => \{\
        button.addEventListener('click', (e) => \{\
            const conversationId = (e.currentTarget as HTMLElement).dataset.conversationId;\
            const userId = (e.currentTarget as HTMLElement).dataset.userId;\
            let conversation = mockConversations.find(c => c.id === conversationId);\
            \
            if (!conversation && userId) \{ \
                 const matchedUser = allUsers.find(u => u.id === userId);\
                 if (matchedUser) \{\
                    conversation = \{\
                        id: conversationId || `chat-$\{userId\}`,\
                        userId: userId,\
                        name: matchedUser.name,\
                        profilePic: matchedUser.profilePic,\
                        lastMessage: "Vous avez match\'e9!",\
                        time: "Maintenant",\
                        unread: 0\
                    \};\
                    if(!mockConversations.find(c => c.id === conversation!.id)) \{\
                       mockConversations.unshift(conversation);\
                    \}\
                 \}\
            \}\
\
            if (conversation) \{\
                if (conversation.unread > 0) conversation.unread = 0;\
                renderMessagingScreen();\
                navigateTo('chat-view-screen', \{ conversation \});\
            \}\
        \});\
    \});\
\}\
\
\
function renderMessagingScreen() \{\
    const listContainer = document.getElementById('conversations-list')!;\
    listContainer.innerHTML = mockConversations.map(conv => `\
        <div class="conversation-item" data-conversation-id="$\{conv.id\}" data-user-id="$\{conv.userId\}">\
            <img src="$\{conv.profilePic\}" alt="$\{conv.name\}">\
            <div class="conversation-details">\
                <h3>$\{conv.name\}</h3>\
                <p class="last-message">$\{conv.partyShare ? `<i class="fas fa-glass-cheers"></i> Soir\'e9e partag\'e9e: $\{conv.partyShare.partyName\}` : conv.lastMessage\}</p>\
            </div>\
            <div class="conversation-info">\
                <span class="time">$\{conv.time\}</span>\
                $\{conv.unread ? `<span class="unread-badge">$\{conv.unread\}</span>` : ''\}\
            </div>\
        </div>\
    `).join('');\
\
    document.querySelectorAll('.conversation-item').forEach(item => \{\
        item.addEventListener('click', (e) => \{\
            const userId = (e.currentTarget as HTMLElement).dataset.userId;\
            const conversation = mockConversations.find(c => c.userId === userId);\
            if (conversation) \{\
                if (conversation.unread > 0) \{\
                    conversation.unread = 0; \
                    renderMessagingScreen(); \
                \}\
                navigateTo('chat-view-screen', \{ conversation \});\
            \}\
        \});\
    \});\
\}\
\
function renderNewChatFriendsScreen() \{\
    const listContainer = document.getElementById('new-chat-friends-list')!;\
    if (!listContainer) return;\
\
    const friends = currentUser.friends.map(friendId => allUsers.find(u => u.id === friendId)).filter(Boolean) as User[];\
\
    if (friends.length === 0) \{\
        listContainer.innerHTML = "<p class='empty-list-message'>Vous n'avez pas encore d'amis \'e0 qui \'e9crire.</p>";\
        return;\
    \}\
\
    listContainer.innerHTML = friends.map(friend => `\
        <div class="friend-item friend-attending-item" data-user-id="$\{friend.id\}" role="button" tabindex="0">\
            <img src="$\{friend.profilePic\}" alt="$\{friend.name\}" class="friend-attending-pic">\
            <span class="friend-attending-name">$\{friend.name\}</span>\
            <i class="fas fa-chevron-right friend-attending-chevron"></i>\
        </div>\
    `).join('');\
\
    listContainer.querySelectorAll('.friend-item').forEach(item => \{\
        item.addEventListener('click', () => \{\
            const friendId = (item as HTMLElement).dataset.userId;\
            if (!friendId) return;\
\
            const friendUser = allUsers.find(u => u.id === friendId);\
            if (!friendUser) return;\
\
            let conversation = mockConversations.find(c => c.userId === friendId);\
            if (!conversation) \{\
                // Create a new conversation\
                conversation = \{\
                    id: `chat-$\{friendId\}`,\
                    userId: friendId,\
                    name: friendUser.name,\
                    lastMessage: "Nouvelle conversation",\
                    time: new Date().toLocaleTimeString([], \{ hour: '2-digit', minute: '2-digit' \}),\
                    unread: 0,\
                    profilePic: friendUser.profilePic\
                \};\
                mockConversations.unshift(conversation); // Add to the beginning for recency\
                renderMessagingScreen(); // Update the main messaging screen\
            \}\
            navigateTo('chat-view-screen', \{ conversation \});\
        \});\
    \});\
\}\
\
\
function renderChatView(conversation: Conversation) \{\
    document.getElementById('chat-with-name')!.textContent = conversation.name;\
    (document.getElementById('chat-avatar') as HTMLImageElement).src = conversation.profilePic;\
\
    const messagesArea = document.getElementById('chat-messages')!;\
    // For now, keep mock messages or load real ones if implemented\
    messagesArea.innerHTML = `\
        <div class="chat-message received">Hey! Merci pour le match!</div>\
        <div class="chat-message sent">Salut $\{conversation.name\}! Pas de souci. Quoi de neuf?</div>\
        $\{conversation.partyShare ? `<div class="chat-message sent system-message">Soir\'e9e partag\'e9e: $\{conversation.partyShare.partyName\}</div>` : ''\}\
    `;\
    messagesArea.scrollTop = messagesArea.scrollHeight; \
\
    const sendButton = document.getElementById('send-chat-message')!;\
    const messageInput = document.getElementById('chat-message-input') as HTMLInputElement;\
\
    const newSendButton = sendButton.cloneNode(true); \
    sendButton.parentNode?.replaceChild(newSendButton, sendButton);\
\
    newSendButton.addEventListener('click', () => \{\
        const messageText = messageInput.value.trim();\
        if (messageText) \{\
            const messageEl = document.createElement('div');\
            messageEl.classList.add('chat-message', 'sent');\
            messageEl.textContent = messageText;\
            messagesArea.appendChild(messageEl);\
            messageInput.value = '';\
            messagesArea.scrollTop = messagesArea.scrollHeight;\
            \
            const convIndex = mockConversations.findIndex(c => c.id === conversation.id);\
            if (convIndex !== -1) \{\
                mockConversations[convIndex].lastMessage = messageText;\
                mockConversations[convIndex].time = new Date().toLocaleTimeString([], \{ hour: '2-digit', minute: '2-digit' \});\
                delete mockConversations[convIndex].partyShare; // Clear party share after new message\
            \}\
            // Mock notification for the recipient if they have notifications enabled\
            const recipientUser = allUsers.find(u => u.id === conversation.userId);\
            if (recipientUser && recipientUser.notificationSettings.messages) \{\
                // In a real app, this would trigger a notification for the recipient\
                console.log(`User $\{recipientUser.id\} would receive a new message notification.`);\
                // alert(`Simulation: $\{recipientUser.name\} a \'e9t\'e9 notifi\'e9(e) de votre message !`);\
            \}\
\
        \}\
    \});\
\}\
\
function renderStatisticsScreen() \{\
    const stats = ensureStatistics(currentUser);\
\
    document.getElementById('stats-fl-sent')!.textContent = stats.facelikesSent.toString();\
    document.getElementById('stats-fl-received-total')!.textContent = (stats.facelikesReceived || 0).toString();\
    (document.getElementById('stats-fl-received-pending') as HTMLElement).textContent = currentUser.pendingFacelikes.length.toString();\
    document.getElementById('stats-fm-total')!.textContent = stats.facematches.toString(); \
    \
    const partyList = document.getElementById('stats-party-list')!;\
    partyList.innerHTML = stats.byParty.map(p => `\
        <li>\
            <strong>$\{p.partyName\}:</strong> \
            Facelikes Re\'e7us (hist.): $\{p.flReceived\}, Envoy\'e9s: $\{p.flSent\}, Matchs (hist.): $\{p.fm\}\
        </li>\
    `).join('');\
\
    document.getElementById('stats-activity-chart-placeholder')!.textContent = "Graphique d'activit\'e9 des Facelikes (Ex: Chart.js)";\
    document.getElementById('stats-party-breakdown-chart-placeholder')!.textContent = "Graphique de r\'e9partition des Facematchs par soir\'e9e (Ex: Chart.js)";\
\
    document.getElementById('stats-friend-req-sent')!.textContent = (stats.friendRequestsSentCount || currentUser.friendRequestsSent.length).toString();\
    document.getElementById('stats-friend-req-received')!.textContent = (stats.friendRequestsReceivedCount || currentUser.friendRequestsReceived.length).toString();\
    document.getElementById('stats-friend-acceptance-rate')!.textContent = stats.friendAcceptanceRate || "N/A";\
\}\
\
function renderSettingsScreen() \{\
    // This screen just lists the navigation buttons, content is handled by sub-screens\
\}\
\
function createToggleOption(id: string, labelText: string, isChecked: boolean, onChange: (checked: boolean) => void): string \{\
    return `\
        <div class="setting-option">\
            <label for="$\{id\}">$\{labelText\}</label>\
            <label class="toggle-switch">\
                <input type="checkbox" id="$\{id\}" $\{isChecked ? 'checked' : ''\}>\
                <span class="slider"></span>\
            </label>\
        </div>\
    `;\
\}\
\
function renderNotificationsSettingScreen() \{\
    const contentEl = document.getElementById('notifications-settings-content')!;\
    contentEl.innerHTML = `\
        <div class="setting-section">\
            <h4>Alertes G\'e9n\'e9rales</h4>\
            $\{createToggleOption('notif-messages', 'Nouveaux messages', currentUser.notificationSettings.messages, (checked) => \{\
                currentUser.notificationSettings.messages = checked;\
                if(checked) alert("Notifications pour les messages activ\'e9es."); else alert("Notifications pour les messages d\'e9sactiv\'e9es.");\
                renderNotificationsSettingScreen(); // Re-render to reflect change (though visual change is via CSS)\
            \})\}\
            $\{createToggleOption('notif-facelikes', 'Nouveaux Facelikes re\'e7us', currentUser.notificationSettings.facelikes, (checked) => \{\
                currentUser.notificationSettings.facelikes = checked;\
                 if(checked) alert("Notifications pour les Facelikes activ\'e9es."); else alert("Notifications pour les Facelikes d\'e9sactiv\'e9es.");\
                renderNotificationsSettingScreen();\
            \})\}\
            $\{createToggleOption('notif-facematches', 'Nouveaux Facematchs', currentUser.notificationSettings.facematches, (checked) => \{\
                currentUser.notificationSettings.facematches = checked;\
                if(checked) alert("Notifications pour les Facematchs activ\'e9es."); else alert("Notifications pour les Facematchs d\'e9sactiv\'e9es.");\
                renderNotificationsSettingScreen();\
            \})\}\
        </div>\
        <div class="setting-section">\
            <h4>Autres Notifications (Exemples)</h4>\
            <p style="color: var(--text-secondary); font-size: 14px;">D'autres options de notification pourraient inclure des mises \'e0 jour de soir\'e9es, des suggestions d'amis, etc.</p>\
        </div>\
    `;\
\
    // Add event listeners\
    document.getElementById('notif-messages')?.addEventListener('change', (e) => (document.getElementById('notif-messages')!.dispatchEvent(new CustomEvent('toggleChange', \{ detail: (e.target as HTMLInputElement).checked \}))));\
    document.getElementById('notif-facelikes')?.addEventListener('change', (e) => (document.getElementById('notif-facelikes')!.dispatchEvent(new CustomEvent('toggleChange', \{ detail: (e.target as HTMLInputElement).checked \}))));\
    document.getElementById('notif-facematches')?.addEventListener('change', (e) => (document.getElementById('notif-facematches')!.dispatchEvent(new CustomEvent('toggleChange', \{ detail: (e.target as HTMLInputElement).checked \}))));\
\
    contentEl.querySelectorAll('.toggle-switch input[type="checkbox"]').forEach(toggle => \{\
        toggle.addEventListener('toggleChange', (e: Event) => \{\
            const customEvent = e as CustomEvent;\
            const handler = (toggle.id === 'notif-messages') ? (checked: boolean) => currentUser.notificationSettings.messages = checked :\
                            (toggle.id === 'notif-facelikes') ? (checked: boolean) => currentUser.notificationSettings.facelikes = checked :\
                            (checked: boolean) => currentUser.notificationSettings.facematches = checked;\
            handler(customEvent.detail);\
            // Simulating saving the preference\
            console.log(`Notification setting $\{toggle.id\} changed to: $\{customEvent.detail\}`);\
            // No need to alert here again if done in createToggleOption's onChange for immediate feedback.\
            // If direct alert is preferred, remove from createToggleOption's onChange and add here.\
        \});\
    \});\
\}\
\
function renderPrivacySettingScreen() \{\
    const contentEl = document.getElementById('privacy-settings-content')!;\
    contentEl.innerHTML = `\
        <div class="setting-section">\
            <h4>Visibilit\'e9 du Profil</h4>\
            $\{createToggleOption('privacy-hide-profile', "Cacher mon profil des r\'e9sultats de recherche de soir\'e9e (sauf si je participe \'e0 la m\'eame soir\'e9e)", currentUser.privacySettings.hideProfileInPartySearch, (checked) => \{\
                currentUser.privacySettings.hideProfileInPartySearch = checked;\
                alert(`Visibilit\'e9 du profil dans la recherche de soir\'e9e $\{checked ? 'restreinte' : 'normale'\}.`);\
                renderPrivacySettingScreen();\
            \})\}\
        </div>\
        <div class="setting-section">\
            <h4>Partage d'Activit\'e9</h4>\
             $\{createToggleOption('privacy-share-status', "Partager mon statut 'En soir\'e9e \'e0...' avec mes amis", currentUser.privacySettings.shareGoingOutStatus, (checked) => \{\
                currentUser.privacySettings.shareGoingOutStatus = checked;\
                alert(`Partage du statut 'En soir\'e9e' $\{checked ? 'activ\'e9' : 'd\'e9sactiv\'e9'\}.`);\
                renderPrivacySettingScreen();\
            \})\}\
        </div>\
         <div class="setting-section">\
            <h4>Gestion des Donn\'e9es (Exemples)</h4>\
            <button class="setting-list-item-button" onclick="alert('Fonctionnalit\'e9 de t\'e9l\'e9chargement des donn\'e9es \'e0 venir.')">T\'e9l\'e9charger mes donn\'e9es</button>\
            <button class="setting-list-item-button" style="color: var(--danger-color);" onclick="confirm('\'cates-vous s\'fbr de vouloir supprimer votre compte ? Cette action est irr\'e9versible.') ? alert('Compte supprim\'e9 (simulation).') : null;">Supprimer mon compte</button>\
        </div>\
    `;\
    // Add event listeners (similar to notifications)\
    document.getElementById('privacy-hide-profile')?.addEventListener('change', (e) => (document.getElementById('privacy-hide-profile')!.dispatchEvent(new CustomEvent('toggleChange', \{ detail: (e.target as HTMLInputElement).checked \}))));\
    document.getElementById('privacy-share-status')?.addEventListener('change', (e) => (document.getElementById('privacy-share-status')!.dispatchEvent(new CustomEvent('toggleChange', \{ detail: (e.target as HTMLInputElement).checked \}))));\
    \
    contentEl.querySelectorAll('.toggle-switch input[type="checkbox"]').forEach(toggle => \{\
        toggle.addEventListener('toggleChange', (e: Event) => \{\
            const customEvent = e as CustomEvent;\
            const handler = (toggle.id === 'privacy-hide-profile') ? (checked: boolean) => currentUser.privacySettings.hideProfileInPartySearch = checked :\
                            (checked: boolean) => currentUser.privacySettings.shareGoingOutStatus = checked;\
            handler(customEvent.detail);\
            console.log(`Privacy setting $\{toggle.id\} changed to: $\{customEvent.detail\}`);\
        \});\
    \});\
\}\
\
\
function renderAccountSettingScreen() \{\
    const contentEl = document.getElementById('account-settings-content')!;\
    contentEl.innerHTML = `\
        <div class="setting-section">\
            <h4>Informations Personnelles</h4>\
            <div class="account-info-item">\
                <p>E-mail: <strong>$\{currentUser.email\}</strong></p>\
                <button class="change-button" id="btn-change-email">Modifier</button>\
            </div>\
            <div class="account-info-item">\
                <p>T\'e9l\'e9phone: <strong>$\{currentUser.phoneNumber\}</strong></p>\
                <button class="change-button" id="btn-change-phone">Modifier</button>\
            </div>\
        </div>\
        <div class="setting-section">\
            <h4>S\'e9curit\'e9</h4>\
            <button id="btn-change-password" class="button">Changer de mot de passe</button>\
            <button id="btn-forgot-password" class="button" style="background-color: var(--secondary-bg); color: var(--text-secondary); margin-top: 10px;">Mot de passe oubli\'e9 ?</button>\
        </div>\
    `;\
\
    document.getElementById('btn-change-email')?.addEventListener('click', () => \{\
        (document.getElementById('current-email-display') as HTMLElement).textContent = currentUser.email;\
        (document.getElementById('new-email-input') as HTMLInputElement).value = '';\
        (document.getElementById('email-verification-code-input') as HTMLInputElement).value = '';\
        (document.getElementById('email-verification-code-group') as HTMLElement).style.display = 'none';\
        (document.getElementById('change-email-feedback') as HTMLElement).textContent = '';\
        showModal('change-email-modal');\
    \});\
    document.getElementById('btn-change-phone')?.addEventListener('click', () => \{\
        (document.getElementById('current-phone-display') as HTMLElement).textContent = currentUser.phoneNumber;\
        (document.getElementById('new-phone-input') as HTMLInputElement).value = '';\
        (document.getElementById('phone-verification-code-input') as HTMLInputElement).value = '';\
        (document.getElementById('phone-verification-code-group') as HTMLElement).style.display = 'none';\
        (document.getElementById('phone-verification-email-info') as HTMLElement).textContent = currentUser.email;\
        (document.getElementById('change-phone-feedback') as HTMLElement).textContent = '';\
        showModal('change-phone-modal');\
    \});\
    document.getElementById('btn-change-password')?.addEventListener('click', () => \{\
        (document.getElementById('old-password-input') as HTMLInputElement).value = '';\
        (document.getElementById('new-password-input') as HTMLInputElement).value = '';\
        (document.getElementById('confirm-new-password-input') as HTMLInputElement).value = '';\
        (document.getElementById('change-password-feedback') as HTMLElement).textContent = '';\
        showModal('change-password-modal');\
    \});\
    document.getElementById('btn-forgot-password')?.addEventListener('click', () => \{\
        (document.getElementById('forgot-password-email-display') as HTMLElement).textContent = currentUser.email;\
        (document.getElementById('forgot-password-phone-display') as HTMLElement).textContent = currentUser.phoneNumber;\
        (document.getElementById('forgot-password-feedback') as HTMLElement).textContent = '';\
        showModal('forgot-password-modal');\
    \});\
\}\
\
function renderHelpSettingScreen() \{\
     const contentEl = document.getElementById('help-settings-content')!;\
    contentEl.innerHTML = `\
        <div class="setting-section">\
            <h4>Questions Fr\'e9quemment Pos\'e9es (FAQ)</h4>\
            <details>\
                <summary>Comment puis-je Faceliker quelqu'un ?</summary>\
                <p class="faq-answer">Sur l'\'e9cran des participants d'une soir\'e9e, ou sur le profil d'un utilisateur, appuyez sur l'ic\'f4ne en forme de c\'9cur. Si la personne vous Facelike en retour, c'est un Facematch !</p>\
            </details>\
            <details>\
                <summary>Comment fonctionnent les suggestions IA ?</summary>\
                <p class="faq-answer">Apr\'e8s avoir rempli vos pr\'e9f\'e9rences priv\'e9es dans votre profil (section "Comment je suis" et "Ce que je recherche"), l'IA peut vous sugg\'e9rer des profils compatibles lors d'une soir\'e9e. Activez la fonction sur l'\'e9cran des participants.</p>\
            </details>\
            <details>\
                <summary>Mes informations priv\'e9es sont-elles visibles par les autres ?</summary>\
                <p class="faq-answer">Les informations que vous entrez dans la section "Priv\'e9e" de votre profil (pour les suggestions IA) ne sont pas directement visibles par les autres utilisateurs. Elles sont utilis\'e9es par l'IA pour calculer la compatibilit\'e9.</p>\
            </details>\
        </div>\
        <div class="setting-section">\
            <h4>Nous Contacter</h4>\
            <div class="contact-info">\
                <p>Pour toute question ou probl\'e8me, contactez notre support :</p>\
                <a href="mailto:support@faceparty.app">support@faceparty.app</a>\
            </div>\
        </div>\
        <div class="setting-section">\
            <h4>L\'e9gal</h4>\
            <div class="terms-links">\
                <a href="#" onclick="alert('Affichage des Conditions G\'e9n\'e9rales d\\\\'Utilisation (Placeholder).'); return false;">Conditions G\'e9n\'e9rales d'Utilisation</a>\
                <a href="#" onclick="alert('Affichage de la Politique de Confidentialit\'e9 (Placeholder).'); return false;">Politique de Confidentialit\'e9</a>\
            </div>\
        </div>\
    `;\
\}\
\
\
function renderFriendsScreen() \{\
    const requestsList = document.getElementById('friend-requests-list')!;\
    document.getElementById('friend-requests-count')!.textContent = currentUser.friendRequestsReceived.length.toString();\
    if (currentUser.friendRequestsReceived.length === 0) \{\
        requestsList.innerHTML = "<p class='empty-list-message'>Aucune nouvelle demande d'ami.</p>";\
    \} else \{\
        requestsList.innerHTML = currentUser.friendRequestsReceived.map(req => `\
            <div class="friend-request-item" data-user-id="$\{req.userId\}">\
                <img src="$\{req.profilePic\}" alt="$\{req.name\}">\
                <div class="friend-info">\
                    <h5>$\{req.name\}</h5>\
                    <p>Vous a envoy\'e9 une demande d'ami.</p>\
                </div>\
                <div class="friend-request-actions">\
                    <button class="accept-friend-button" data-user-id="$\{req.userId\}">Accepter</button>\
                    <button class="decline-friend-button decline" data-user-id="$\{req.userId\}">Refuser</button>\
                </div>\
            </div>\
        `).join('');\
    \}\
\
    const friendsListEl = document.getElementById('friends-list')!;\
    document.getElementById('friends-count')!.textContent = currentUser.friends.length.toString();\
    if (currentUser.friends.length === 0) \{\
        friendsListEl.innerHTML = "<p class='empty-list-message'>Vous n'avez pas encore d'amis. Scannez leur QR code !</p>";\
    \} else \{\
        friendsListEl.innerHTML = currentUser.friends.map(friendId => \{\
            const friend = allUsers.find(u => u.id === friendId);\
            if (!friend) return '';\
            const isGoingOutText = friend.isGoingOut && friend.goingOutToPartyName && friend.privacySettings.shareGoingOutStatus \
                ? `En soir\'e9e \'e0: $\{friend.goingOutToPartyName\}` \
                : 'Ne sort pas ce soir ou statut priv\'e9';\
            return `\
                <div class="friend-item" data-user-id="$\{friend.id\}">\
                    <img src="$\{friend.profilePic\}" alt="$\{friend.name\}">\
                    <div class="friend-info">\
                        <h5>$\{friend.name\}</h5>\
                        <p>$\{isGoingOutText\}</p>\
                    </div>\
                    <div class="friend-item-action">\
                        <button class="view-profile-button" data-user-id="$\{friend.id\}"><i class="fas fa-eye"></i> Profil</button>\
                    </div>\
                </div>\
            `;\
        \}).join('');\
    \}\
\
    requestsList.querySelectorAll('.accept-friend-button').forEach(btn => \
        btn.addEventListener('click', (e) => acceptFriendRequest((e.currentTarget as HTMLElement).dataset.userId!))\
    );\
    requestsList.querySelectorAll('.decline-friend-button').forEach(btn => \
        btn.addEventListener('click', (e) => declineFriendRequest((e.currentTarget as HTMLElement).dataset.userId!))\
    );\
    friendsListEl.querySelectorAll('.view-profile-button').forEach(btn =>\
        btn.addEventListener('click', (e) => \{\
            const friendId = (e.currentTarget as HTMLElement).dataset.userId!;\
            const friend = allUsers.find(u => u.id === friendId);\
            if (friend) navigateTo('participant-profile-screen', \{ participant: friend, source: 'friends-list' \});\
        \})\
    );\
\}\
\
function sendFriendRequest(targetUserId: string) \{\
    const targetUser = allUsers.find(u => u.id === targetUserId);\
    if (!targetUser) return alert("Utilisateur non trouv\'e9.");\
    if (currentUser.id === targetUserId) return alert("Vous ne pouvez pas vous ajouter vous-m\'eame.");\
    if (currentUser.friends.includes(targetUserId)) return alert("Vous \'eates d\'e9j\'e0 amis.");\
    if (currentUser.friendRequestsSent.includes(targetUserId)) return alert("Demande d\'e9j\'e0 envoy\'e9e.");\
    if (targetUser.friendRequestsReceived.some(req => req.userId === currentUser.id)) return alert("Demande d\'e9j\'e0 envoy\'e9e.");\
\
    ensureUserDetails(targetUser); // Ensure targetUser has necessary fields\
    targetUser.friendRequestsReceived.push(\{\
        userId: currentUser.id,\
        name: currentUser.name,\
        profilePic: currentUser.profilePic,\
        date: new Date().toISOString()\
    \});\
    currentUser.friendRequestsSent.push(targetUserId);\
    const currentUserStats = ensureStatistics(currentUser);\
    currentUserStats.friendRequestsSentCount = (currentUserStats.friendRequestsSentCount || 0) + 1;\
\
\
    alert(`Demande d'ami envoy\'e9e \'e0 $\{targetUser.name\}.`);\
    if (currentScreenId === 'participant-profile-screen' && currentViewedParticipantContext?.id === targetUserId) \{\
        renderParticipantProfileScreen(targetUser, navigationSourceForParticipantProfile);\
    \}\
\}\
\
function acceptFriendRequest(requestingUserId: string) \{\
    const userIndex = allUsers.findIndex(u => u.id === currentUser.id);\
    const requestingUserIndex = allUsers.findIndex(u => u.id === requestingUserId);\
\
    if (userIndex === -1 || requestingUserIndex === -1) return;\
\
    allUsers[userIndex].friends.push(requestingUserId);\
    allUsers[userIndex].friendRequestsReceived = allUsers[userIndex].friendRequestsReceived.filter(req => req.userId !== requestingUserId);\
    \
    allUsers[requestingUserIndex].friends.push(currentUser.id);\
    allUsers[requestingUserIndex].friendRequestsSent = allUsers[requestingUserIndex].friendRequestsSent.filter(id => id !== currentUser.id);\
\
    currentUser = allUsers[userIndex]; \
    renderFriendsScreen();\
\}\
\
function declineFriendRequest(requestingUserId: string) \{\
     const userIndex = allUsers.findIndex(u => u.id === currentUser.id);\
    if (userIndex === -1) return;\
    \
    allUsers[userIndex].friendRequestsReceived = allUsers[userIndex].friendRequestsReceived.filter(req => req.userId !== requestingUserId);\
    currentUser = allUsers[userIndex];\
    renderFriendsScreen();\
\}\
\
function removeFriend(friendId: string) \{\
    const currentUserIdx = allUsers.findIndex(u => u.id === currentUser.id);\
    const friendUserIdx = allUsers.findIndex(u => u.id === friendId);\
\
    if (currentUserIdx > -1) \{\
        allUsers[currentUserIdx].friends = allUsers[currentUserIdx].friends.filter(id => id !== friendId);\
        currentUser = allUsers[currentUserIdx]; \
    \}\
    if (friendUserIdx > -1) \{\
        allUsers[friendUserIdx].friends = allUsers[friendUserIdx].friends.filter(id => id !== currentUser.id);\
    \}\
    \
    alert(`$\{allUsers[friendUserIdx]?.name || 'Cet utilisateur'\} a \'e9t\'e9 retir\'e9 de votre liste d'amis.`);\
    if (currentScreenId === 'friends-screen') \{\
        renderFriendsScreen();\
    \} else if (currentScreenId === 'participant-profile-screen' && currentViewedParticipantContext?.id === friendId) \{\
        goBack(); \
    \}\
\}\
\
\
function showMyQrCode() \{\
    const modal = document.getElementById('qr-code-modal')!;\
    const qrText = document.getElementById('my-qr-code-data-text')!;\
    (document.getElementById('my-qr-code-img') as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=$\{encodeURIComponent(currentUser.qrCodeData)\}`;\
    qrText.textContent = currentUser.qrCodeData;\
    modal.style.display = 'flex';\
\}\
\
function closeQrModal() \{ // Renamed to avoid conflict with generic closeModal\
    const modal = document.getElementById('qr-code-modal')!;\
    modal.style.display = 'none';\
\}\
\
function renderLineupDetailsScreen(party: Party) \{\
    document.getElementById('lineup-details-party-name')!.textContent = `Line-up - $\{party.name\}`;\
    const scheduleTitle = document.getElementById('lineup-details-schedule-title')!;\
    scheduleTitle.textContent = `Programme de ce soir \'e0 $\{party.name\}`;\
    \
    const scheduleList = document.getElementById('lineup-details-schedule-list')!;\
    if (party.musicLineup.schedule && party.musicLineup.schedule.length > 0) \{\
        scheduleList.innerHTML = party.musicLineup.schedule.map(item => `\
            <li><strong>$\{item.time\}:</strong> $\{item.artist\} - $\{item.track\}</li>\
        `).join('');\
    \} else \{\
        scheduleList.innerHTML = "<li class='empty-list-message'>Programme non disponible.</li>";\
    \}\
\
    const historyList = document.getElementById('lineup-details-history-list')!;\
     if (party.musicLineup.history && party.musicLineup.history.length > 0) \{\
        historyList.innerHTML = party.musicLineup.history.map(item => `\
            <li><strong>$\{item.date\}:</strong> $\{item.artist\} - $\{item.track\}</li>\
        `).join('');\
    \} else \{\
        historyList.innerHTML = "<li class='empty-list-message'>Historique musical non disponible.</li>";\
    \}\
\}\
\
function renderFpVisitorsHistoryScreen(party: Party) \{\
    document.getElementById('fp-visitors-history-party-name')!.textContent = `Historique Visiteurs FP - $\{party.name\}`;\
    const list = document.getElementById('fp-visitors-history-list')!;\
    if (party.pastEventsFacePartyAttendance && party.pastEventsFacePartyAttendance.length > 0) \{\
        list.innerHTML = party.pastEventsFacePartyAttendance.map(event => `\
            <div class="fp-visitor-event-item">\
                <div class="fp-visitor-event-info">\
                    <span class="fp-visitor-event-name">$\{event.eventName\} ($\{event.date\})</span>\
                    <span class="fp-visitor-event-attendees">$\{event.fpAttendees\} participants FaceParty</span>\
                </div>\
            </div>\
        `).join('');\
    \} else \{\
        list.innerHTML = "<p class='empty-list-message'>Aucun historique de visiteurs FaceParty disponible pour ce lieu.</p>";\
    \}\
\}\
\
function renderSendPartyToFriendsScreen(party: Party) \{\
    document.getElementById('send-party-to-friends-title')!.textContent = `Envoyer $\{party.name\}`;\
    const listContainer = document.getElementById('send-party-to-friends-list-container')!;\
    selectedFriendsForPartyShare = []; // Reset selection\
\
    const friends = currentUser.friends.map(friendId => allUsers.find(u => u.id === friendId)).filter(Boolean) as User[];\
\
    if (friends.length === 0) \{\
        listContainer.innerHTML = "<p class='empty-list-message' style='padding:20px;'>Vous n'avez pas d'amis \'e0 qui partager.</p>";\
        (document.getElementById('send-party-to-friends-action-button') as HTMLButtonElement).style.display = 'none';\
        return;\
    \}\
    (document.getElementById('send-party-to-friends-action-button') as HTMLButtonElement).style.display = 'block';\
\
    listContainer.innerHTML = friends.map(friend => `\
        <div class="friend-selection-item" data-user-id="$\{friend.id\}" role="checkbox" aria-checked="false" tabindex="0">\
            <img src="$\{friend.profilePic\}" alt="$\{friend.name\}">\
            <div class="friend-info">\
                <h5>$\{friend.name\}</h5>\
            </div>\
            <div class="friend-item-checkbox">\
                <i class="far fa-circle"></i> <!-- Unchecked by default -->\
            </div>\
        </div>\
    `).join('');\
\
    listContainer.querySelectorAll('.friend-selection-item').forEach(item => \{\
        item.addEventListener('click', (e) => \{\
            const targetItem = e.currentTarget as HTMLElement;\
            const userId = targetItem.dataset.userId!;\
            const icon = targetItem.querySelector('.friend-item-checkbox i') as HTMLElement;\
            const isSelected = targetItem.getAttribute('aria-checked') === 'true';\
\
            if (isSelected) \{\
                targetItem.setAttribute('aria-checked', 'false');\
                icon.classList.remove('fa-check-circle', 'fas');\
                icon.classList.add('fa-circle', 'far');\
                selectedFriendsForPartyShare = selectedFriendsForPartyShare.filter(id => id !== userId);\
            \} else \{\
                targetItem.setAttribute('aria-checked', 'true');\
                icon.classList.remove('fa-circle', 'far');\
                icon.classList.add('fa-check-circle', 'fas');\
                selectedFriendsForPartyShare.push(userId);\
            \}\
        \});\
    \});\
\}\
\
function handleSendPartyToSelectedFriends() \{\
    if (!currentPartyContext || selectedFriendsForPartyShare.length === 0) \{\
        alert("Veuillez s\'e9lectionner au moins un ami.");\
        return;\
    \}\
\
    const partyName = currentPartyContext.name;\
    const partyId = currentPartyContext.id;\
    const messageText = `D\'e9couvre cette soir\'e9e : $\{partyName\} !`;\
\
    selectedFriendsForPartyShare.forEach(friendId => \{\
        const friend = allUsers.find(u => u.id === friendId);\
        if (!friend) return;\
\
        let conversation = mockConversations.find(c => c.userId === friendId);\
        const timeNow = new Date().toLocaleTimeString([], \{ hour: '2-digit', minute: '2-digit' \});\
\
        if (conversation) \{\
            conversation.lastMessage = messageText;\
            conversation.time = timeNow;\
            conversation.unread = (conversation.unread || 0) + 1;\
            conversation.partyShare = \{ partyId, partyName \};\
        \} else \{\
            conversation = \{\
                id: `chat-$\{friendId\}`,\
                userId: friendId,\
                name: friend.name,\
                profilePic: friend.profilePic,\
                lastMessage: messageText,\
                time: timeNow,\
                unread: 1,\
                partyShare: \{ partyId, partyName \}\
            \};\
            mockConversations.unshift(conversation);\
        \}\
        // Simulate notification for the friend\
        if(friend.notificationSettings.messages) \{\
            console.log(`User $\{friend.id\} would receive a party share notification for $\{partyName\} from $\{currentUser.name\}.`);\
        \}\
    \});\
\
    alert(`$\{partyName\} partag\'e9 avec $\{selectedFriendsForPartyShare.length\} ami(s).`);\
    renderMessagingScreen(); // Update messaging screen with new/updated conversations\
    navigateTo('messaging-screen');\
    selectedFriendsForPartyShare = []; // Clear selection\
\}\
\
\
// Event Listeners\
document.addEventListener('DOMContentLoaded', () => \{\
    renderHomeScreen();\
    renderProfileScreen(); \
    renderSearchScreen(); \
    renderFacelikesScreen();\
    renderFacematchesTodayScreen();\
    renderMessagingScreen();\
    renderStatisticsScreen();\
    renderSettingsScreen(); // This will just set up the main settings screen view\
    renderFriendsScreen();\
    renderNewChatFriendsScreen();\
    \
    document.getElementById('home-search-bar')?.addEventListener('click', () => navigateTo('search-screen'));\
    document.getElementById('btn-friends')?.addEventListener('click', () => navigateTo('friends-screen'));\
    document.getElementById('btn-stats')?.addEventListener('click', () => navigateTo('statistics-screen'));\
    document.getElementById('btn-settings')?.addEventListener('click', () => navigateTo('settings-screen'));\
    document.getElementById('home-messages-button')?.addEventListener('click', () => navigateTo('messaging-screen'));\
    document.getElementById('messaging-screen-new-message-button')?.addEventListener('click', () => navigateTo('new-chat-friends-screen'));\
\
    \
    document.getElementById('home-facelike-stat-trigger')?.addEventListener('click', () => navigateTo('facelikes-screen'));\
    document.getElementById('home-facematch-stat-trigger')?.addEventListener('click', () => navigateTo('facematches-today-screen'));\
\
    document.getElementById('edit-profile-info-button')?.addEventListener('click', toggleProfileEdit);\
    document.getElementById('add-profile-photo-button')?.addEventListener('click', () => alert('Add photos feature coming soon!'));\
\
    document.querySelectorAll('.back-button').forEach(button => \{\
        button.addEventListener('click', goBack);\
    \});\
\
    const aiSuggestionTriggerButton = document.getElementById('ai-suggestion-trigger-button');\
    if (aiSuggestionTriggerButton) \{\
        aiSuggestionTriggerButton.addEventListener('click', () => \{\
            const engineArea = document.getElementById('ai-suggestion-engine-area');\
            if (engineArea) engineArea.style.display = 'block';\
            currentAiSuggestionType = 'appealsToMe'; \
            updateAiSuggestionTypeButtons();\
            getAISuggestions();\
        \});\
    \}\
    \
    document.getElementById('ai-suggestion-type-appeals-to-me')?.addEventListener('click', () => setAiSuggestionType('appealsToMe'));\
    document.getElementById('ai-suggestion-type-i-appeal-to')?.addEventListener('click', () => setAiSuggestionType('iAppealTo'));\
    document.getElementById('ai-suggestion-type-mutual-match')?.addEventListener('click', () => setAiSuggestionType('mutualMatch'));\
\
    document.getElementById('btn-finish-ai-suggestions')?.addEventListener('click', () => \{\
        const engineArea = document.getElementById('ai-suggestion-engine-area');\
        const suggestionsListContainer = document.getElementById('ai-suggestions-list-container');\
        const rankingTitleElement = document.getElementById('ai-current-ranking-title');\
        const finishButton = document.getElementById('btn-finish-ai-suggestions');\
\
        if (engineArea) engineArea.style.display = 'none';\
        if (suggestionsListContainer) suggestionsListContainer.innerHTML = '';\
        if (rankingTitleElement) rankingTitleElement.textContent = '';\
        if (finishButton) finishButton.style.display = 'none';\
    \});\
\
\
    document.getElementById('nav-home')?.addEventListener('click', () => navigateTo('home-screen'));\
    document.getElementById('nav-search')?.addEventListener('click', () => navigateTo('search-screen'));\
    document.getElementById('nav-facelikes')?.addEventListener('click', () => navigateTo('facelikes-screen'));\
    document.getElementById('nav-messages')?.addEventListener('click', () => navigateTo('messaging-screen'));\
    document.getElementById('nav-profile')?.addEventListener('click', () => navigateTo('profile-screen'));\
\
    const reRenderParticipants = () => \{ if(currentPartyContext) renderPartyParticipants(currentPartyContext) \};\
    document.getElementById('filter-gender')?.addEventListener('change', reRenderParticipants);\
    document.getElementById('filter-specific-gender')?.addEventListener('change', reRenderParticipants);\
    document.getElementById('filter-country')?.addEventListener('input', reRenderParticipants);\
    document.getElementById('filter-height')?.addEventListener('change', reRenderParticipants);\
    document.getElementById('filter-eye-color')?.addEventListener('change', reRenderParticipants);\
    document.getElementById('filter-hair-color')?.addEventListener('change', reRenderParticipants);\
    \
    document.getElementById('btn-my-facelikes')?.addEventListener('click', () => navigateTo('facelikes-screen'));\
    document.getElementById('btn-lineup')?.addEventListener('click', () => \{\
        if(currentPartyContext) navigateTo('lineup-details-screen', \{ party: currentPartyContext \});\
    \});\
    \
    document.getElementById('show-qr-code-button')?.addEventListener('click', showMyQrCode);\
    document.getElementById('close-qr-modal-button')?.addEventListener('click', closeQrModal);\
\
    const ageFilterButton = document.getElementById('filter-age-button');\
    const ageCheckboxesList = document.getElementById('filter-age-checkboxes-list');\
    ageFilterButton?.addEventListener('click', () => \{\
        const isExpanded = ageFilterButton.getAttribute('aria-expanded') === 'true';\
        ageFilterButton.setAttribute('aria-expanded', String(!isExpanded));\
        if (ageCheckboxesList) ageCheckboxesList.style.display = isExpanded ? 'none' : 'block';\
    \});\
    // Close age dropdown if clicking outside\
    document.addEventListener('click', (event) => \{\
        if (ageFilterButton && ageCheckboxesList && !ageFilterButton.contains(event.target as Node) && !ageCheckboxesList.contains(event.target as Node)) \{\
            ageFilterButton.setAttribute('aria-expanded', 'false');\
            ageCheckboxesList.style.display = 'none';\
        \}\
    \});\
\
\
    // Modal close buttons (generic)\
    document.querySelectorAll('.modal .modal-close-button').forEach(button => \{\
        button.addEventListener('click', (e) => \{\
            const modal = (e.currentTarget as HTMLElement).closest('.modal');\
            if (modal) \{\
                closeModal(modal.id);\
            \}\
        \});\
    \});\
\
    window.addEventListener('click', (event) => \{ \
        // Close modals if clicked outside content\
        document.querySelectorAll('.modal').forEach(modal => \{\
            if (event.target === modal) \{\
                closeModal(modal.id);\
            \}\
        \});\
    \});\
\
    // Event listeners for new setting item buttons (on main settings screen)\
    const settingsContent = document.querySelector('#settings-screen .settings-content');\
    if (settingsContent) \{\
        settingsContent.querySelectorAll('.setting-list-item-button').forEach(button => \{\
            button.addEventListener('click', (e) => \{\
                const target = (e.currentTarget as HTMLElement).dataset.settingTarget;\
                if (target) \{\
                    if (target === 'logout-action') \{\
                        if (confirm("\'cates-vous s\'fbr de vouloir vous d\'e9connecter ?")) \{\
                            alert("D\'e9connexion effectu\'e9e (simulation).\\nDans une vraie application, vous seriez redirig\'e9 vers l'\'e9cran de connexion.");\
                            navigateTo('home-screen'); // Or a login screen\
                        \}\
                    \} else \{\
                        navigateTo(target);\
                    \}\
                \}\
            \});\
        \});\
    \}\
\
    // Account Settings Modals Logic\
    // Change Email\
    document.getElementById('send-email-code-button')?.addEventListener('click', () => \{\
        const newEmail = (document.getElementById('new-email-input') as HTMLInputElement).value;\
        const feedbackEl = document.getElementById('change-email-feedback') as HTMLElement;\
        if (!newEmail || !newEmail.includes('@')) \{\
            feedbackEl.textContent = 'Veuillez entrer une adresse e-mail valide.';\
            feedbackEl.className = 'modal-feedback error';\
            return;\
        \}\
        alert(`Un code de v\'e9rification ( $\{MOCK_VERIFICATION_CODE\} ) a \'e9t\'e9 envoy\'e9 \'e0 $\{newEmail\}. (Simulation)`);\
        (document.getElementById('email-verification-code-group') as HTMLElement).style.display = 'block';\
        feedbackEl.textContent = '';\
    \});\
    document.getElementById('verify-new-email-button')?.addEventListener('click', () => \{\
        const newEmail = (document.getElementById('new-email-input') as HTMLInputElement).value;\
        const code = (document.getElementById('email-verification-code-input') as HTMLInputElement).value;\
        const feedbackEl = document.getElementById('change-email-feedback') as HTMLElement;\
        if (code === MOCK_VERIFICATION_CODE) \{\
            currentUser.email = newEmail;\
            feedbackEl.textContent = 'Adresse e-mail mise \'e0 jour avec succ\'e8s !';\
            feedbackEl.className = 'modal-feedback success';\
            setTimeout(() => \{\
                closeModal('change-email-modal');\
                renderAccountSettingScreen(); // Re-render to show updated email\
            \}, 1500);\
        \} else \{\
            feedbackEl.textContent = 'Code de v\'e9rification incorrect.';\
            feedbackEl.className = 'modal-feedback error';\
        \}\
    \});\
\
    // Change Phone\
    document.getElementById('send-phone-code-button')?.addEventListener('click', () => \{\
        const newPhone = (document.getElementById('new-phone-input') as HTMLInputElement).value;\
         const feedbackEl = document.getElementById('change-phone-feedback') as HTMLElement;\
        if (!newPhone || newPhone.length < 10) \{ // Basic validation\
            feedbackEl.textContent = 'Veuillez entrer un num\'e9ro de t\'e9l\'e9phone valide.';\
            feedbackEl.className = 'modal-feedback error';\
            return;\
        \}\
        alert(`Un code de v\'e9rification ( $\{MOCK_VERIFICATION_CODE\} ) a \'e9t\'e9 envoy\'e9 \'e0 votre e-mail $\{currentUser.email\}. (Simulation)`);\
        (document.getElementById('phone-verification-code-group') as HTMLElement).style.display = 'block';\
        feedbackEl.textContent = '';\
    \});\
    document.getElementById('verify-new-phone-button')?.addEventListener('click', () => \{\
        const newPhone = (document.getElementById('new-phone-input') as HTMLInputElement).value;\
        const code = (document.getElementById('phone-verification-code-input') as HTMLInputElement).value;\
        const feedbackEl = document.getElementById('change-phone-feedback') as HTMLElement;\
        if (code === MOCK_VERIFICATION_CODE) \{\
            currentUser.phoneNumber = newPhone;\
            feedbackEl.textContent = 'Num\'e9ro de t\'e9l\'e9phone mis \'e0 jour avec succ\'e8s !';\
            feedbackEl.className = 'modal-feedback success';\
            setTimeout(() => \{\
                closeModal('change-phone-modal');\
                renderAccountSettingScreen();\
            \}, 1500);\
        \} else \{\
            feedbackEl.textContent = 'Code de v\'e9rification incorrect.';\
            feedbackEl.className = 'modal-feedback error';\
        \}\
    \});\
    \
    // Change Password\
    document.getElementById('save-new-password-button')?.addEventListener('click', () => \{\
        const oldPassword = (document.getElementById('old-password-input') as HTMLInputElement).value;\
        const newPassword = (document.getElementById('new-password-input') as HTMLInputElement).value;\
        const confirmNewPassword = (document.getElementById('confirm-new-password-input') as HTMLInputElement).value;\
        const feedbackEl = document.getElementById('change-password-feedback') as HTMLElement;\
\
        if (oldPassword !== currentUser.password) \{\
            feedbackEl.textContent = 'L\\'ancien mot de passe est incorrect.';\
            feedbackEl.className = 'modal-feedback error';\
            return;\
        \}\
        if (!newPassword || newPassword.length < 6) \{\
            feedbackEl.textContent = 'Le nouveau mot de passe doit comporter au moins 6 caract\'e8res.';\
            feedbackEl.className = 'modal-feedback error';\
            return;\
        \}\
        if (newPassword !== confirmNewPassword) \{\
            feedbackEl.textContent = 'Les nouveaux mots de passe ne correspondent pas.';\
            feedbackEl.className = 'modal-feedback error';\
            return;\
        \}\
        currentUser.password = newPassword;\
        feedbackEl.textContent = 'Mot de passe mis \'e0 jour avec succ\'e8s !';\
        feedbackEl.className = 'modal-feedback success';\
        setTimeout(() => closeModal('change-password-modal'), 1500);\
    \});\
\
    // Forgot Password\
    document.getElementById('forgot-password-send-email')?.addEventListener('click', () => \{\
        alert(`Instructions de r\'e9initialisation envoy\'e9es \'e0 $\{currentUser.email\}. (Simulation)`);\
        closeModal('forgot-password-modal');\
    \});\
    document.getElementById('forgot-password-send-phone')?.addEventListener('click', () => \{\
        alert(`Instructions de r\'e9initialisation envoy\'e9es \'e0 $\{currentUser.phoneNumber\}. (Simulation)`);\
        closeModal('forgot-password-modal');\
    \});\
\
    // Share Party Modal Logic\
    document.getElementById('share-party-copy-link-button')?.addEventListener('click', () => \{\
        if (!currentPartyContext) return;\
        const partyLink = `https://faceparty.app/party/$\{currentPartyContext.id\}`; // Mock link\
        navigator.clipboard.writeText(partyLink).then(() => \{\
            const feedbackEl = document.getElementById('share-party-feedback') as HTMLElement;\
            feedbackEl.textContent = 'Lien copi\'e9 !';\
            feedbackEl.className = 'modal-feedback success';\
        \}).catch(err => \{\
            console.error('Failed to copy link: ', err);\
            const feedbackEl = document.getElementById('share-party-feedback') as HTMLElement;\
            feedbackEl.textContent = 'Erreur lors de la copie.';\
            feedbackEl.className = 'modal-feedback error';\
        \});\
    \});\
\
    document.getElementById('share-party-send-to-friends-button')?.addEventListener('click', () => \{\
        if (!currentPartyContext) return;\
        closeModal('share-party-modal');\
        navigateTo('send-party-to-friends-screen', \{ party: currentPartyContext \});\
    \});\
\
    document.getElementById('send-party-to-friends-action-button')?.addEventListener('click', handleSendPartyToSelectedFriends);\
\
\
\});\
\
// Gemini API Integration\
const API_KEY = process.env.API_KEY;\
let ai: GoogleGenAI | null = null;\
if (API_KEY) \{\
    ai = new GoogleGenAI(\{ apiKey: API_KEY \});\
\} else \{\
    console.warn("API_KEY environment variable not set. AI features will be limited.");\
\}\
\
function setAiSuggestionType(type: 'appealsToMe' | 'iAppealTo' | 'mutualMatch') \{\
    currentAiSuggestionType = type;\
    updateAiSuggestionTypeButtons();\
    getAISuggestions();\
\}\
\
function updateAiSuggestionTypeButtons() \{\
    const buttons = document.querySelectorAll('.ai-suggestion-type-button');\
    buttons.forEach(button => \{\
        if ((button as HTMLElement).dataset.type === currentAiSuggestionType) \{\
            button.classList.add('active');\
        \} else \{\
            button.classList.remove('active');\
        \}\
    \});\
\}\
\
\
async function getAISuggestions() \{\
    const suggestionsListContainer = document.getElementById('ai-suggestions-list-container');\
    const rankingTitleElement = document.getElementById('ai-current-ranking-title');\
    const finishButton = document.getElementById('btn-finish-ai-suggestions');\
\
    if (!suggestionsListContainer || !rankingTitleElement || !finishButton) return;\
\
    if (!ai) \{ \
        suggestionsListContainer.innerHTML = "<p>Fonctionnalit\'e9 IA non disponible (cl\'e9 API manquante).</p>";\
        rankingTitleElement.textContent = "Suggestions IA indisponibles";\
        finishButton.style.display = 'block';\
        return;\
    \}\
    if (!currentPartyContext) \{\
        suggestionsListContainer.innerHTML = "<p>Veuillez d'abord rejoindre une soir\'e9e pour obtenir des suggestions.</p>";\
        rankingTitleElement.textContent = "Aucune soir\'e9e s\'e9lectionn\'e9e";\
        finishButton.style.display = 'block';\
        return;\
    \}\
     if (!currentUser.privatePreferences || !currentUser.privatePreferences.selfDescription || !currentUser.privatePreferences.partnerDescription) \{\
        suggestionsListContainer.innerHTML = "<p>Veuillez compl\'e9ter votre section priv\'e9e dans votre profil pour utiliser cette fonctionnalit\'e9.</p>";\
        rankingTitleElement.textContent = "Pr\'e9f\'e9rences priv\'e9es manquantes";\
        finishButton.style.display = 'block';\
        return;\
    \}\
\
    suggestionsListContainer.innerHTML = '<div class="spinner"></div><p style="text-align:center;">Recherche des suggestions...</p>';\
    finishButton.style.display = 'none'; // Hide until suggestions load or fail\
    \
    // 1. Get active filter values from UI\
    const genderFilterValue = (document.getElementById('filter-gender') as HTMLSelectElement).value;\
    const specificGenderSelect = document.getElementById('filter-specific-gender') as HTMLSelectElement;\
    const specificGenderFilterValue = (genderFilterValue === 'other' && specificGenderSelect.style.display !== 'none' && specificGenderSelect.value !== "") ? specificGenderSelect.value : null;\
\
    const selectedAgeRangeLabels: string[] = [];\
    document.querySelectorAll('#filter-age-checkboxes-list input[type="checkbox"]:checked').forEach(cb => \{\
        selectedAgeRangeLabels.push((cb as HTMLInputElement).value);\
    \});\
\
    const countryFilterValue = (document.getElementById('filter-country') as HTMLInputElement).value.toLowerCase();\
    const heightFilterValue = (document.getElementById('filter-height') as HTMLSelectElement).value; // This is the 'value' like '170_above'\
    const eyeColorFilterValue = (document.getElementById('filter-eye-color') as HTMLSelectElement).value;\
    const hairColorFilterValue = (document.getElementById('filter-hair-color') as HTMLSelectElement).value;\
\
\
    // 2. Apply UI filters to create a base list of participants\
    let activeParticipantsFromUIFilters = allUsers.filter(p => \{\
        if (p.id === currentUser.id) return false; \
        if (currentPartyContext && (!p.isGoingOut || p.goingOutToPartyId !== currentPartyContext.id)) return false;\
\
        let match = true;\
         if (genderFilterValue !== 'all') \{\
            if (genderFilterValue === 'other') \{\
                if (p.gender !== 'other') match = false;\
                if (specificGenderFilterValue && p.detailedGender !== specificGenderFilterValue) match = false;\
            \} else \{\
                if (p.gender !== genderFilterValue) match = false;\
            \}\
        \}\
        \
        if (selectedAgeRangeLabels.length > 0) \{\
            let ageMatch = false;\
            for (const rangeLabel of selectedAgeRangeLabels) \{\
                const rangeConfig = AGE_RANGES_CONFIG.find(r => r.label === rangeLabel);\
                if (rangeConfig && p.age >= rangeConfig.min && p.age <= rangeConfig.max) \{\
                    ageMatch = true;\
                    break;\
                \}\
            \}\
            if (!ageMatch) match = false;\
        \}\
\
        if (countryFilterValue && !p.country.toLowerCase().includes(countryFilterValue)) match = false;\
        \
        if (heightFilterValue !== "" && heightFilterValue !== "all") \{\
            const heightNum = parseInt(p.height); // e.g., "175cm" -> 175\
            const selectedHeightConfig = HEIGHT_OPTIONS_CONFIG.find(hOpt => hOpt.value === heightFilterValue);\
            if (selectedHeightConfig && heightNum < selectedHeightConfig.min) \{\
                 match = false;\
            \}\
        \}\
\
\
        if (eyeColorFilterValue !== "" && p.eyeColor.toLowerCase() !== eyeColorFilterValue.toLowerCase()) match = false;\
        if (hairColorFilterValue !== "" && p.hairColor.toLowerCase() !== hairColorFilterValue.toLowerCase()) match = false;\
        \
        return match;\
    \});\
    \
    // 3. Further filter for those with private preferences\
    const partyParticipantsWithPrefs = activeParticipantsFromUIFilters.filter(u => \
        u.privatePreferences && u.privatePreferences.selfDescription && u.privatePreferences.partnerDescription\
    );\
\
    if (partyParticipantsWithPrefs.length === 0) \{\
        suggestionsListContainer.innerHTML = "<p style='text-align:center;'>Peu de participants correspondant \'e0 vos filtres ont rempli leurs pr\'e9f\'e9rences priv\'e9es.</p>";\
        rankingTitleElement.textContent = "Donn\'e9es insuffisantes";\
        finishButton.style.display = 'block';\
        return;\
    \}\
    \
    let prompt = "";\
    const selfDesc = currentUser.privatePreferences.selfDescription;\
    const partnerDesc = currentUser.privatePreferences.partnerDescription;\
    \
    const commonInstructions = `R\'e9ponds UNIQUEMENT avec une liste num\'e9rot\'e9e des noms complets des personnes suivis de leur pourcentage de compatibilit\'e9 (par exemple: Pr\'e9nom Nom (90%)). Si personne ne correspond, r\'e9ponds "Personne ne semble correspondre."`;\
    const filterContextMessage = "Les personnes suivantes sont \'e0 cette soir\'e9e et correspondent d\'e9j\'e0 \'e0 mes filtres de base (tels que l'\'e2ge, le genre, etc.).";\
\
\
    switch (currentAiSuggestionType) \{\
        case 'appealsToMe':\
            rankingTitleElement.textContent = "Classement des personnes qui pourraient VOUS plaire";\
            const otherSelfDescs = partyParticipantsWithPrefs.map(p => `- $\{p.name\}: "$\{p.privatePreferences.selfDescription\}"`).join('\\n');\
            prompt = `Je recherche une personne qui est : "$\{partnerDesc\}". $\{filterContextMessage\} Voici comment elles se d\'e9crivent :\\n$\{otherSelfDescs\}\\n\\nClasse ces personnes de celle qui correspond le mieux \'e0 ma recherche \'e0 celle qui correspond le moins. $\{commonInstructions\}`;\
            break;\
        case 'iAppealTo':\
            rankingTitleElement.textContent = "Classement des personnes \'e0 qui VOUS pourriez plaire";\
            const otherPartnerDescs = partyParticipantsWithPrefs.map(p => `- $\{p.name\} recherche: "$\{p.privatePreferences.partnerDescription\}"`).join('\\n');\
            prompt = `Je suis une personne qui se d\'e9crit comme : "$\{selfDesc\}". $\{filterContextMessage\} Voici ce qu'elles recherchent :\\n$\{otherPartnerDescs\}\\n\\nClasse ces personnes de celle qui serait la plus susceptible d'\'eatre attir\'e9e par moi \'e0 la moins susceptible. $\{commonInstructions\}`;\
            break;\
        case 'mutualMatch':\
            rankingTitleElement.textContent = "Classement des matchs mutuels potentiels";\
            const mutualData = partyParticipantsWithPrefs.map(p => `- $\{p.name\} (se d\'e9crit: "$\{p.privatePreferences.selfDescription\}", recherche: "$\{p.privatePreferences.partnerDescription\}")`).join('\\n');\
            prompt = `Je suis une personne qui se d\'e9crit comme : "$\{selfDesc\}" et je recherche : "$\{partnerDesc\}". $\{filterContextMessage\} Voici leurs descriptions et ce qu'elles recherchent :\\n$\{mutualData\}\\n\\nClasse ces personnes en fonction de la compatibilit\'e9 mutuelle la plus \'e9lev\'e9e (o\'f9 mes pr\'e9f\'e9rences correspondent \'e0 leur description ET leurs pr\'e9f\'e9rences correspondent \'e0 ma description) \'e0 la plus faible. $\{commonInstructions\}`;\
            break;\
    \}\
\
    try \{\
        const response: GenerateContentResponse = await ai.models.generateContent(\{\
            model: "gemini-2.5-flash-preview-04-17",\
            contents: prompt,\
        \});\
        \
        const textResponse = response.text.trim();\
        if (textResponse && !textResponse.toLowerCase().includes("personne ne semble correspondre")) \{\
            const lines = textResponse.split('\\n');\
            const suggestedEntries: \{ name: string; percentageStr: string; user: User | undefined \}[] = [];\
            const namePercentRegex = /(.+?)\\s*\\((\\d\{1,3\})%\\)/;\
\
            lines.forEach(line => \{\
                const cleanedLine = line.replace(/^\\d+\\.\\s*/, '').trim(); \
                const match = cleanedLine.match(namePercentRegex);\
                let name = cleanedLine; \
                let percentageStr = "N/A";\
\
                if (match && match[1] && match[2]) \{\
                    name = match[1].trim();\
                    percentageStr = `$\{match[2]\}%`;\
                \} else \{\
                    name = cleanedLine; \
                \}\
                \
                if (name.length > 0) \{\
                    let foundUser = partyParticipantsWithPrefs.find(u => u.name.toLowerCase() === name.toLowerCase());\
                    if (!foundUser && name.includes(" ")) \{\
                         foundUser = partyParticipantsWithPrefs.find(u => u.name.toLowerCase().startsWith(name.split(" ")[0].toLowerCase()));\
                    \} else if (!foundUser) \{\
                         foundUser = partyParticipantsWithPrefs.find(u => u.name.toLowerCase().startsWith(name.toLowerCase()));\
                    \}\
\
                    if (foundUser && !suggestedEntries.find(se => se.user?.id === foundUser!.id)) \{ \
                        suggestedEntries.push(\{ name: foundUser.name, percentageStr, user: foundUser \});\
                    \}\
                \}\
            \});\
\
\
            if (suggestedEntries.length > 0) \{\
                 suggestionsListContainer.innerHTML = suggestedEntries.map(entry => `\
                    <div class="ai-suggestion-participant-card" data-user-id="$\{entry.user!.id\}" role="button" tabindex="0" aria-label="View profile of $\{entry.name\}">\
                        <img src="$\{entry.user!.profilePic\}" alt="$\{entry.name\}">\
                        <div class="info">\
                            <h5>$\{entry.name\}</h5>\
                            <p>$\{entry.user!.age\} ans</p>\
                        </div>\
                        <span class="ai-match-percentage">$\{entry.percentageStr\}</span>\
                    </div>\
                `).join('');\
                suggestionsListContainer.querySelectorAll('.ai-suggestion-participant-card').forEach(card => \{\
                    card.addEventListener('click', (e) => \{\
                        const userId = (e.currentTarget as HTMLElement).dataset.userId;\
                        const user = allUsers.find(u => u.id === userId); \
                        if (user) navigateTo('participant-profile-screen', \{ participant: user, source: 'ai-suggestions' \});\
                    \});\
                \});\
            \} else \{\
                 suggestionsListContainer.innerHTML = `<p style="text-align:center;">L'IA n'a pas pu former un classement clair. Essayez de reformuler vos pr\'e9f\'e9rences ou r\'e9essayez plus tard.</p>`;\
            \}\
        \} else \{\
             suggestionsListContainer.innerHTML = `<p style="text-align:center;">$\{textResponse || "Aucune suggestion pour le moment."\}</p>`;\
        \}\
\
    \} catch (error) \{\
        console.error("Error calling Gemini API:", error);\
        suggestionsListContainer.innerHTML = "<p style='text-align:center;'>Erreur lors de la r\'e9cup\'e9ration des suggestions IA. Veuillez r\'e9essayer plus tard.</p>";\
    \} finally \{\
        finishButton.style.display = 'block'; \
    \}\
\}\
\
\
// Initial active screen\
navigateTo('home-screen');}