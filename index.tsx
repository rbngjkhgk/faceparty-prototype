
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Data Types
type PartyMusicTrack = { date?: string; time?: string; artist: string; track: string };
type PartyMusicLineup = {
    schedule: PartyMusicTrack[];
    history: PartyMusicTrack[]; // For last 6 months
};
type PartyPastEventAttendance = { eventName: string; date: string; fpAttendees: number };

type Party = {
    id: string;
    name: string;
    date: string;
    imageUrl: string;
    media: string[];
    location: string;
    time: string;
    dressCode: string;
    music: string;
    rating: number; // This is the current average rating
    currentViewers: number; // Current people in party (non-FP specific)
    fpCount: number; // Current FP users in party
    selectivity: string;
    monthlyRatings: { month: string; year: number; rating: number }[];
    comments: { id: string; text: string; timestamp: string; anonymousUserHandle: string }[];
    totalFacePartyVisitorsEver: number; // New field
    pastEventsFacePartyAttendance: PartyPastEventAttendance[]; // New field
    musicLineup: PartyMusicLineup; // New field
};

type UserStatistics = {
    facelikesSent: number;
    facelikesReceived: number; 
    facematches: number; 
    byParty: { partyName: string; flReceived: number; flSent: number; fm: number }[];
    activityOverTime?: { period: string, value: number }[];
    facelikeSources?: { partyName: string, count: number }[];
    friendRequestsSentCount?: number;
    friendRequestsReceivedCount?: number;
    friendAcceptanceRate?: string;
};

type PendingFacelike = {
    id: string; 
    userId: string; 
    name: string;
    profilePic: string;
    partyId: string;
    partyName: string;
    dateReceived: string; 
    message?: string;
};

type ConfirmedFacematch = {
    matchId: string; 
    userId: string; 
    name: string;
    profilePic: string;
    partyId: string;
    partyName: string;
    dateMatched: string; 
    conversationId: string;
};

type NotificationSettings = {
    messages: boolean;
    facelikes: boolean;
    facematches: boolean;
};

type PrivacySettings = {
    hideProfileInPartySearch: boolean; // Hide from general search unless at same party
    shareGoingOutStatus: boolean; // Share "En soirée à..." with friends
};

type User = {
    id: string;
    name: string;
    age: number;
    bio: string;
    profilePictureUrl: string;
    coverPhotoUrl?: string; 
    faceMatches: number; 
    faceLikes: number;   
    favoriteDrink: string;
    height: string; // Storing as string e.g., "175cm"
    eyeColor: string;
    hairColor: string;
    nationality: string;
    photos?: string[];
    statistics: UserStatistics; 
    gender: 'male' | 'female' | 'other';
    detailedGender?: string; // For LGBT+ identities if gender is 'other'
    country: string;
    profilePic: string; 
    isFaceliked?: boolean; 
    
    friends: string[]; 
    friendRequestsReceived: { userId: string, name: string, profilePic: string, date: string }[];
    friendRequestsSent: string[]; 
    qrCodeData: string; 
    isGoingOut: boolean;
    goingOutToPartyId?: string;
    goingOutToPartyName?: string;

    pendingFacelikes: PendingFacelike[]; 
    confirmedFacematches: ConfirmedFacematch[]; 
    privatePreferences: { 
        selfDescription: string;
        partnerDescription: string;
    };
    email: string; 
    phoneNumber: string; 
    password?: string; 
    notificationSettings: NotificationSettings; 
    privacySettings: PrivacySettings; 
};

type Conversation = {
    id: string;
    userId: string;
    name: string;
    lastMessage: string;
    time: string;
    unread: number;
    profilePic: string;
    partyShare?: { partyId: string, partyName: string }; // For shared party messages
};

// Constants for new filter options
const AGE_RANGES_CONFIG = [
    { label: "18-21", min: 18, max: 21, id: "age-18-21" },
    { label: "22-24", min: 22, max: 24, id: "age-22-24" },
    { label: "25-28", min: 25, max: 28, id: "age-25-28" },
    { label: "29-31", min: 29, max: 31, id: "age-29-31" },
    { label: "32-34", min: 32, max: 34, id: "age-32-34" },
    { label: "35-37", min: 35, max: 37, id: "age-35-37" },
    { label: "38-40", min: 38, max: 40, id: "age-38-40" },
    { label: "41-43", min: 41, max: 43, id: "age-41-43" },
    { label: "45-50", min: 45, max: 50, id: "age-45-50" },
    { label: "50-55", min: 50, max: 55, id: "age-50-55" },
    { label: "55-60", min: 55, max: 60, id: "age-55-60" },
    { label: "60+", min: 60, max: Infinity, id: "age-60-plus" },
];

const HEIGHT_OPTIONS_CONFIG: { label: string; value: string; min: number }[] = [];
for (let h = 160; h <= 210; h += 2) {
    HEIGHT_OPTIONS_CONFIG.push({ label: `${h}cm et plus`, value: `${h}_above`, min: h });
}


const LGBT_GENDERS = [
    "Non-binary", "Transgender Woman", "Transgender Man", "Genderqueer", "Genderfluid",
    "Agender", "Two-Spirit", "Pangender", "Androgyne", "Intersex", "Demiboy", "Demigirl", "Questioning", "Other"
];

const EYE_COLORS = [
    "Amber", "Blue", "Brown", "Gray", "Green", "Hazel", "Red/Violet",
    "Heterochromia (Complete)", "Heterochromia (Central)", "Heterochromia (Sectoral)", 
    "Variegated (Mixed Colors)", "Black", "Dark Brown", "Light Brown", "Dark Blue", "Light Blue",
    "Dark Green", "Light Green", "Steel Gray", "Violet", "Pink", "Yellow", "Other"
];

const HAIR_COLORS = [
    "Black", "Dark Brown", "Medium Brown", "Light Brown", "Dark Blonde", "Medium Blonde",
    "Light Blonde", "Platinum Blonde", "Red (Natural)", "Auburn", "Chestnut", "Strawberry Blonde",
    "Gray", "White", "Salt & Pepper", "Blue (Dyed)", "Pink (Dyed)", "Green (Dyed)", 
    "Purple (Dyed)", "Orange (Dyed)", "Silver (Dyed)", "Rainbow/Multi-color (Dyed)", "Other (Dyed)", "Bald", "Other"
];

// Helper functions
function isToday(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

function ensureStatistics(user: User): UserStatistics {
    if (!user.statistics) {
        user.statistics = {
            facelikesSent: 0,
            facelikesReceived: 0,
            facematches: 0,
            byParty: [],
            friendRequestsSentCount: 0,
            friendRequestsReceivedCount: 0,
            friendAcceptanceRate: "N/A"
        };
    }
    if (!user.statistics.byParty) {
        user.statistics.byParty = [];
    }
    return user.statistics;
}

function formatTimestamp(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSeconds < 60) return `Il y a ${diffSeconds} sec`;
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return `Hier`; // Simplified as per image
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return `Le ${date.toLocaleDateString()}`;
}

const MOCK_VERIFICATION_CODE = "123456";

// Mock Data
let allUsers: User[] = [
    {
        id: "u0", 
        name: "Florian Edouard",
        age: 24,
        bio: "Developer #web #software #mobileDev | #graphicdesigner #Artist #fullstackdeveloper",
        profilePictureUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cHJvZmlsZSUyMHBpY3R1cmV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=120&q=60",
        profilePic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cHJvZmlsZSUyMHBpY3R1cmV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=70&q=60",
        coverPhotoUrl: "https://images.unsplash.com/photo-1520034475321-cbe63696469a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cGFydHklMjBjb3ZlcnxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=400&q=60",
        faceMatches: 0, 
        faceLikes: 0,   
        favoriteDrink: "Moscow Mule",
        height: "175cm",
        eyeColor: "Brown",
        hairColor: "Dark Brown",
        nationality: "Française",
        photos: [
            "https://images.unsplash.com/photo-1517423568366-8b83523034fd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8cHJvZmlsZSUyMHBob3RvfGVufDB8fDB8fHww&auto=format&fit=crop&w=80&q=60",
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cHJvZmlsZSUyMHBob3RvfGVufDB8fDB8fHww&auto=format&fit=crop&w=80&q=60",
            "https://images.unsplash.com/photo-1521119989659-a83eee488004?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8cHJvZmlsZSUyMHBob3RvfGVufDB8fDB8fHww&auto=format&fit=crop&w=80&q=60",
        ],
        statistics: {
            facelikesSent: 120,
            facelikesReceived: 3, 
            facematches: 17, 
            byParty: [
                { partyName: "PARADISE CLUB", flReceived: 2, flSent: 30, fm: 5}, 
                { partyName: "BANANA CLUB", flReceived: 1, flSent: 20, fm: 3},
            ],
            friendRequestsSentCount: 5,
            friendRequestsReceivedCount: 2,
            friendAcceptanceRate: "80%"
        },
        gender: "male",
        country: "France",
        friends: ["u1", "u3", "u4"], 
        friendRequestsReceived: [ { userId: "u2", name: "Alex", profilePic: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=70&q=60", date: new Date().toISOString()}],
        friendRequestsSent: ["u8"],
        qrCodeData: "faceparty_user_u0_florian_edouard",
        isGoingOut: true,
        goingOutToPartyId: "p1",
        goingOutToPartyName: "PARADISE CLUB",
        pendingFacelikes: [
            { 
                id: "pfl1", userId: "u4", name: "Stacy Candice", 
                profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=50&q=60", 
                partyId: "p1", partyName: "PARADISE CLUB", dateReceived: new Date().toISOString(), message: "Can we catchup for Lunch."
            },
            { 
                id: "pfl2", userId: "u5", name: "Jeniffer Canning", 
                profilePic: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fHByb2ZpbGV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=50&q=60",
                partyId: "p2", partyName: "BANANA CLUB", dateReceived: new Date(Date.now() - 86400000 * 2).toISOString(),
                message: "Good Morning"
            },
            { 
                id: "pfl3", userId: "u9", name: "Maria", 
                profilePic: "https://images.unsplash.com/photo-1554151228-14d9def656e4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZmVtYWxlJTIwcHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=70&q=60",
                partyId: "p1", partyName: "PARADISE CLUB", dateReceived: new Date().toISOString(),
            }
        ],
        confirmedFacematches: [
             { matchId: "cfm1", userId: "u3", name: "Sophie", profilePic: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=70&q=60", partyId: "p1", partyName: "PARADISE CLUB", dateMatched: new Date(Date.now() - 86400000).toISOString(), conversationId: "chat-u3"}, 
        ],
        privatePreferences: {
            selfDescription: "Je suis un développeur passionné par les nouvelles technologies, l'art et la musique électronique. J'aime les discussions profondes mais aussi m'amuser et danser toute la nuit. Loyal, créatif et un peu geek.",
            partnerDescription: "Je recherche une personne curieuse, ouverte d'esprit, avec un bon sens de l'humour. Quelqu'un qui aime sortir, découvrir de nouvelles choses, et qui a des passions. Physiquement, j'apprécie un style naturel, des yeux expressifs (peu importe la couleur) et un sourire sincère. Origine indifférente, la connexion est le plus important."
        },
        email: "florian.edouard@example.com",
        phoneNumber: "+33612345678",
        password: "password123", // Mock password
        notificationSettings: {
            messages: true,
            facelikes: true,
            facematches: true
        },
        privacySettings: {
            hideProfileInPartySearch: false,
            shareGoingOutStatus: true
        }
    },
    { id: "u1", name: "Camila", age: 23, bio: "Dernière année de pharma. Invite moi à danser", profilePic: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=70&q=60", profilePictureUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=120&q=60", gender: "female", country: "France", height: "165cm", favoriteDrink: "Mojito", eyeColor:"Green", hairColor:"Light Blonde", nationality:"Française", isFaceliked: false, friends: ["u0"], friendRequestsReceived: [], friendRequestsSent: [], qrCodeData: "faceparty_user_u1_camila", isGoingOut: true, goingOutToPartyId: "p1", goingOutToPartyName: "PARADISE CLUB", pendingFacelikes: [], confirmedFacematches: [], faceLikes: 0, faceMatches: 0, statistics: { facelikesSent: 0, facelikesReceived: 0, facematches: 0, byParty: []}, privatePreferences: { selfDescription: "Étudiante en pharmacie, j'adore la musique latine et sortir entre amis. Je suis souriante, dynamique et j'aime prendre soin des autres.", partnerDescription: "Je cherche quelqu'un d'amusant, respectueux et qui aime danser. Idéalement plus grand que moi, avec un beau sourire. Peu importe la couleur des cheveux ou des yeux, tant que le feeling passe." }, email: "camila@example.com", phoneNumber: "+33600000001", notificationSettings: { messages: true, facelikes: true, facematches: false }, privacySettings: { hideProfileInPartySearch: false, shareGoingOutStatus: true }, password: "password123" },
    { id: "u2", name: "Alex", age: 30, bio: "Just here to vibe and meet new people.", profilePic: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=70&q=60", profilePictureUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=120&q=60", gender: "other", detailedGender: "Non-binary", country: "USA", height: "180cm", favoriteDrink: "Bière", eyeColor:"Blue", hairColor:"Salt & Pepper", nationality:"Américaine", isFaceliked: false, friends: [], friendRequestsReceived: [], friendRequestsSent: ["u0"], qrCodeData: "faceparty_user_u2_alex", isGoingOut: false, pendingFacelikes: [], confirmedFacematches: [], faceLikes: 0, faceMatches: 0, statistics: { facelikesSent: 0, facelikesReceived: 0, facematches: 0, byParty: []}, privatePreferences: { selfDescription: "American guy exploring Paris. Love electronic music, good food, and interesting conversations. Easy-going and adventurous.", partnerDescription: "Looking for someone fun to explore the city with. Open-minded, kind, and ideally speaks some English. Eye color: green or brown. Hair color: brunette." }, email: "alex@example.com", phoneNumber: "+12025550101", notificationSettings: { messages: true, facelikes: true, facematches: true }, privacySettings: { hideProfileInPartySearch: true, shareGoingOutStatus: false }, password: "password123" },
    { id: "u3", name: "Sophie", age: 21, bio: "Student, loves dancing.", profilePic: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=70&q=60", profilePictureUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=120&q=60", gender: "female", country: "Canada", height: "170cm", favoriteDrink: "Vin rouge", eyeColor:"Hazel", hairColor:"Black", nationality:"Canadienne", isFaceliked: true, friends: ["u0"], friendRequestsReceived: [], friendRequestsSent: [], qrCodeData: "faceparty_user_u3_sophie", isGoingOut: true, goingOutToPartyId: "p2", goingOutToPartyName: "BANANA CLUB", pendingFacelikes: [], confirmedFacematches: [], faceLikes: 0, faceMatches: 0, statistics: { facelikesSent: 0, facelikesReceived: 0, facematches: 0, byParty: []}, privatePreferences: { selfDescription: "Étudiante canadienne, passionnée de danse et de voyages. J'aime rire et découvrir de nouvelles cultures. Simple et spontanée.", partnerDescription: "Cherche un partenaire de danse et d'aventure. Quelqu'un de drôle, attentionné, et qui aime les soirées animées. Préférence pour les cheveux foncés et les yeux clairs (bleu ou vert)." }, email: "sophie@example.ca", phoneNumber: "+15145550102", notificationSettings: { messages: false, facelikes: true, facematches: true }, privacySettings: { hideProfileInPartySearch: false, shareGoingOutStatus: true }, password: "password123" },
    { id: "u4", name: "Stacy Candice", age: 22, bio: "Fashion enthusiast.", profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=70&q=60", profilePictureUrl:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=120&q=60", gender: "female", country: "USA", height: "168cm", favoriteDrink: "Cosmopolitan", eyeColor:"Blue", hairColor:"Platinum Blonde", nationality:"Américaine", isFaceliked: false, friends: ["u0"], friendRequestsReceived: [], friendRequestsSent: [], qrCodeData: "faceparty_user_u4_stacy", isGoingOut: true, goingOutToPartyId: "p1", goingOutToPartyName: "PARADISE CLUB", pendingFacelikes: [], confirmedFacematches: [], faceLikes: 0, faceMatches: 0, statistics: { facelikesSent: 0, facelikesReceived: 0, facematches: 0, byParty: []}, privatePreferences: { selfDescription: "Amoureuse de la mode et des sorties entre filles. J'adore la musique pop et les cocktails. Dynamique et toujours partante pour une nouvelle aventure.", partnerDescription: "Je recherche un homme élégant, avec du charisme et qui sait me faire rire. Idéalement grand, cheveux châtains ou bruns, yeux bleus ou verts. Doit aimer la mode et les belles choses." }, email: "stacy@example.com", phoneNumber: "+13105550103", notificationSettings: { messages: true, facelikes: true, facematches: true }, privacySettings: { hideProfileInPartySearch: false, shareGoingOutStatus: true }, password: "password123" },
    { id: "u5", name: "Jeniffer Canning", age: 46, bio: "Loves to travel and explore.", profilePic: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fHByb2ZpbGV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=70&q=60", profilePictureUrl:"https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fHByb2ZpbGV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=120&q=60", gender: "female", country: "UK", height: "172cm", favoriteDrink: "Gin Tonic", eyeColor:"Green", hairColor:"Red (Natural)", nationality:"Britannique", isFaceliked: false, friends: [], friendRequestsReceived: [], friendRequestsSent: [], qrCodeData: "faceparty_user_u5_jeniffer", isGoingOut: false, pendingFacelikes: [], confirmedFacematches: [], faceLikes: 0, faceMatches: 0, statistics: { facelikesSent: 0, facelikesReceived: 0, facematches: 0, byParty: []}, privatePreferences: { selfDescription: "Globetrotteuse britannique, j'aime l'art, la photographie et les bons vins. Curieuse et indépendante.", partnerDescription: "Je cherche quelqu'un d'intelligent, cultivé, avec qui je peux avoir des conversations intéressantes. Apprécie les personnes qui ont voyagé. Physiquement, pas de type précis, mais une belle énergie est essentielle." }, email: "jeniffer@example.co.uk", phoneNumber: "+447700900004", notificationSettings: { messages: true, facelikes: true, facematches: true }, privacySettings: { hideProfileInPartySearch: false, shareGoingOutStatus: true }, password: "password123" },
    { id: "u8", name: "David", age: 27, bio: "Tech enthusiast and amateur DJ.", profilePic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8bWFsZSUyMHByb2ZpbGV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=70&q=60", profilePictureUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8bWFsZSUyMHByb2ZpbGV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=120&q=60", gender: "male", country: "UK", height: "178cm", favoriteDrink: "Whiskey", eyeColor:"Green", hairColor:"Auburn", nationality:"Britannique", isFaceliked: false, friends: [], friendRequestsReceived: [], friendRequestsSent: [], qrCodeData: "faceparty_user_u8_david", isGoingOut: true, goingOutToPartyId: "p2", goingOutToPartyName: "BANANA CLUB", pendingFacelikes: [], confirmedFacematches: [], faceLikes: 0, faceMatches: 0, statistics: { facelikesSent: 0, facelikesReceived: 0, facematches: 0, byParty: []}, privatePreferences: { selfDescription: "Ingénieur en tech le jour, DJ amateur la nuit. J'adore la musique house et techno. Calme, observateur et passionné par l'innovation.", partnerDescription: "Recherche une femme indépendante, qui aime la musique électronique et qui n'a pas peur de sortir des sentiers battus. Préférence pour les brunes aux yeux foncés, mais ouverte à toutes." }, email: "david@example.co.uk", phoneNumber: "+447700900008", notificationSettings: { messages: true, facelikes: true, facematches: true }, privacySettings: { hideProfileInPartySearch: false, shareGoingOutStatus: true }, password: "password123" },
    { id: "u9", name: "Maria", age: 24, bio: "Traveler and food lover.", profilePic: "https://images.unsplash.com/photo-1554151228-14d9def656e4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZmVtYWxlJTIwcHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=70&q=60", profilePictureUrl: "https://images.unsplash.com/photo-1554151228-14d9def656e4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZmVtYWxlJTIwcHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=120&q=60", gender: "female", country: "Spain", height: "160cm", favoriteDrink: "Sangria", eyeColor:"Brown", hairColor:"Black", nationality:"Espagnole", isFaceliked: false, friends: [], friendRequestsReceived: [], friendRequestsSent: [], qrCodeData: "faceparty_user_u9_maria", isGoingOut: true, goingOutToPartyId: "p1", goingOutToPartyName: "PARADISE CLUB", pendingFacelikes: [], confirmedFacematches: [], faceLikes: 0, faceMatches: 0, statistics: { facelikesSent: 0, facelikesReceived: 0, facematches: 0, byParty: []}, privatePreferences: { selfDescription: "Espagnole passionnée par les voyages, la gastronomie et la photographie. Je suis sociable, joyeuse et j'aime apprendre de nouvelles langues.", partnerDescription: "Cherche quelqu'un d'aventureux, curieux et qui aime bien manger. Pas de critère physique strict, mais un bon sens de l'humour est indispensable. Origine indifférente." }, email: "maria@example.es", phoneNumber: "+34600000009", notificationSettings: { messages: true, facelikes: true, facematches: true }, privacySettings: { hideProfileInPartySearch: false, shareGoingOutStatus: true }, password: "password123" },
];

// User session state
let isUserLoggedIn = false;
let currentUserId: string | null = null; 
let currentUser: User | null = null; 


function ensureUserDetails(user: User): User {
    ensureStatistics(user);
    if (!user.privatePreferences) {
        user.privatePreferences = { 
            selfDescription: "Pas encore de description privée.", 
            partnerDescription: "Ouvert(e) à rencontrer de nouvelles personnes." 
        };
    }
    if (user.gender === 'other' && !user.detailedGender) {
        // user.detailedGender = "Non spécifié"; // Or keep undefined
    }
    if (!user.email) user.email = `${user.id}@example.com`; // Ensure unique email for new users
    if (!user.phoneNumber) user.phoneNumber = `+336${Math.floor(10000000 + Math.random() * 90000000)}`;
    if (!user.notificationSettings) {
        user.notificationSettings = { messages: true, facelikes: true, facematches: true };
    }
    if (!user.privacySettings) {
        user.privacySettings = { hideProfileInPartySearch: false, shareGoingOutStatus: true };
    }
    if (!user.password) user.password = "password123"; 
    if (!user.profilePic || !user.profilePictureUrl) {
        // Assign a generic placeholder if missing, based on gender or just a default
        const defaultMalePic = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cHJvZmlsZSUyMHBpY3R1cmV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=70&q=60";
        const defaultFemalePic = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=70&q=60";
        const genericPic = "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cHJvZmlsZSUyMHBsYWNlaG9sZGVyfGVufDB8fDB8fHww&auto=format&fit=crop&w=70&q=60"
        user.profilePic = user.gender === 'male' ? defaultMalePic : user.gender === 'female' ? defaultFemalePic : genericPic;
        user.profilePictureUrl = user.profilePic.replace('w=70', 'w=120'); // larger version for profile
    }
    if (!user.coverPhotoUrl) {
         user.coverPhotoUrl = "https://images.unsplash.com/photo-1520034475321-cbe63696469a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cGFydHklMjBjb3ZlcnxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=400&q=60";
    }
    if (!user.favoriteDrink) user.favoriteDrink = "Eau";
    if (!user.height) user.height = "Non spécifié";
    if (!user.eyeColor) user.eyeColor = "Non spécifié";
    if (!user.hairColor) user.hairColor = "Non spécifié";
    if (!user.nationality) user.nationality = "Non spécifié";
    if (!user.country) user.country = "France";
    if (!user.photos) user.photos = [];
    if (!user.friends) user.friends = [];
    if (!user.friendRequestsReceived) user.friendRequestsReceived = [];
    if (!user.friendRequestsSent) user.friendRequestsSent = [];
    if (!user.qrCodeData) user.qrCodeData = `faceparty_user_${user.id}_${user.name.replace(/\s+/g, '_').toLowerCase()}`;
    if (typeof user.isGoingOut === 'undefined') user.isGoingOut = false;
    if (!user.pendingFacelikes) user.pendingFacelikes = [];
    if (!user.confirmedFacematches) user.confirmedFacematches = [];
    if (typeof user.faceLikes === 'undefined') user.faceLikes = user.pendingFacelikes.length;
    if (typeof user.faceMatches === 'undefined') user.faceMatches = user.confirmedFacematches.filter(fm => isToday(fm.dateMatched)).length;


    return user;
}


allUsers.forEach(ensureUserDetails);


const partiesAround: Party[] = [
    { 
        id: "p1", name: "PARADISE CLUB", date: "24 Août", 
        imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGFydHl8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=130&q=60", 
        media: ["https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGFydHl8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1527489377706-592a5a08078d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fHBhcnR5fGVufDB8fDB8fHww&auto=format&fit=crop&w=400&q=80", "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fHBhcnR5fGVufDB8fDB8fHww&auto=format&fit=crop&w=400&q=80"], 
        location: "Rue de la paix 10, Paris 1er", time: "18h00-03h00", dressCode: "Tenue décontractée", music: "African House Mix & Banana bass", 
        rating: 4.5, currentViewers: 210, fpCount: 42, selectivity: "Entrée gratuite pour les filles et pour les garçons accompagnés jusqu'à 22h",
        monthlyRatings: [
            { month: "Jan", year: 2024, rating: 4.2 },
            { month: "Fev", year: 2024, rating: 4.4 },
            { month: "Mar", year: 2024, rating: 4.5 },
        ],
        comments: [
            { id: "c1p1", text: "Super ambiance, la musique était top !", timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), anonymousUserHandle: "Oiseau de Nuit" },
            { id: "c2p1", text: "Un peu trop de monde à mon goût, mais bonne soirée quand même.", timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), anonymousUserHandle: "Fêtard Discret" },
        ],
        totalFacePartyVisitorsEver: 1250,
        pastEventsFacePartyAttendance: [
            { eventName: "Summer Kickoff", date: "10 Juin 2024", fpAttendees: 150 },
            { eventName: "Weekend Grooves", date: "17 Juin 2024", fpAttendees: 180 },
            { eventName: "Midsummer Night", date: "24 Juin 2024", fpAttendees: 220 },
        ],
        musicLineup: {
            schedule: [
                { time: "18:00 - 20:00", artist: "DJ Warmup", track: "Chill Vibes Mix" },
                { time: "20:00 - 22:00", artist: "DJ Set Electro", track: "Live Set" },
                { time: "22:00 - 00:00", artist: "DJ African House", track: "Main Set" },
                { time: "00:00 - 03:00", artist: "DJ Banana Bass", track: "Closing Set" },
            ],
            history: [ // Last 6 months (simplified)
                { date: "2024-07-20", artist: "Guest DJ Mila", track: "Tech House Classics" },
                { date: "2024-07-13", artist: "Resident DJ Alex", track: "Deep House Grooves" },
                { date: "2024-06-29", artist: "DJ Afrobeat Special", track: "Afro Rhythms Night" },
            ]
        }
    },
    { 
        id: "p2", name: "BANANA CLUB", date: "25 Août", 
        imageUrl: "https://images.unsplash.com/photo-1527489377706-592a5a08078d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHBhcnR5fGVufDB8fDB8fHww&auto=format&fit=crop&w=130&q=60", 
        media: ["https://images.unsplash.com/photo-1527489377706-592a5a08078d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHBhcnR5fGVufDB8fDB8fHww&auto=format&fit=crop&w=400&q=80"], 
        location: "Rue de Rivoli 64, Paris 1er", time: "19h00-05h00", dressCode: "Chic", music: "Minimal & Drum and Bass", 
        rating: 4.2, currentViewers: 150, fpCount: 30, selectivity: "Payant après 23h",
        monthlyRatings: [
            { month: "Fev", year: 2024, rating: 4.0 },
            { month: "Mar", year: 2024, rating: 4.2 },
        ],
        comments: [
            { id: "c1p2", text: "Le DJ était incroyable !", timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), anonymousUserHandle: "Explorateur Sonore" },
        ],
        totalFacePartyVisitorsEver: 880,
        pastEventsFacePartyAttendance: [
            { eventName: "Minimal Monday", date: "08 Juillet 2024", fpAttendees: 90 },
            { eventName: "DnB Night", date: "15 Juillet 2024", fpAttendees: 120 },
        ],
        musicLineup: {
            schedule: [
                { time: "19:00 - 21:00", artist: "DJ Minima", track: "Minimal Set" },
                { time: "21:00 - 00:00", artist: "DJ Bassline", track: "Drum & Bass Power Hour" },
                { time: "00:00 - 05:00", artist: "All Stars", track: "B2B Session" },
            ],
            history: [
                 { date: "2024-07-22", artist: "DJ Breaker", track: "Jungle Fever" },
            ]
        }
    },
    { 
        id: "p3", name: "MALL DOLE", date: "26 Août", 
        imageUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fHBhcnR5fGVufDB8fDB8fHww&auto=format&fit=crop&w=130&q=60", 
        media: ["https://images.unsplash.com/photo-1530103862676-de8c9debad1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fHBhcnR5fGVufDB8fDB8fHww&auto=format&fit=crop&w=400&q=80"], 
        location: "Avenue de l'Opéra 26, Paris 1er", time: "18h00-03h00", dressCode: "Année 90", music: "90s Hits", 
        rating: 4.0, currentViewers: 180, fpCount: 25, selectivity: "Ouvert à tous",
        monthlyRatings: [],
        comments: [],
        totalFacePartyVisitorsEver: 500,
        pastEventsFacePartyAttendance: [],
        musicLineup: { schedule: [], history: [] }
    },
];

const pastParties: Party[] = [
    { id: "p4", name: "VENTURA NIGHT", date: "15 Juil", imageUrl: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8cGFydHl8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=130&q=60", media: ["https://images.unsplash.com/photo-1541532713592-79a0317b6b77?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8cGFydHl8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=400&q=80"], location: "Somewhere Else", time: "15 Juil", dressCode:"", music:"", rating:3.8, currentViewers:0, fpCount:0, selectivity:"", monthlyRatings: [], comments: [], totalFacePartyVisitorsEver: 300, pastEventsFacePartyAttendance: [], musicLineup: { schedule: [], history: [] } },
    { id: "p5", name: "DRUM AND BASS FEST", date: "02 Juin", imageUrl: "https://images.unsplash.com/photo-1562208472-88759d049f29?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGNsdWJ8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=130&q=60", media: ["https://images.unsplash.com/photo-1562208472-88759d049f29?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGNsdWJ8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=400&q=80"], location: "Another Place", time: "02 Juin", dressCode:"", music:"", rating:4.1, currentViewers:0, fpCount:0, selectivity:"", monthlyRatings: [], comments: [], totalFacePartyVisitorsEver: 450, pastEventsFacePartyAttendance: [], musicLineup: { schedule: [], history: [] } },
];

let mockConversations: Conversation[] = [
    { id: "c1", userId: "u6", name: "Ada Thorne", lastMessage: "Alors, quoi de prévu ce weekend?;)", time: "15:41", unread: 1, profilePic: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fHByb2ZpbGV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=50&q=60"},
    { id: "c2", userId: "u7", name: "Manille Verpuis", lastMessage: "Tu as raison, prends ton temps!", time: "12:21", unread: 0, profilePic: "https://images.unsplash.com/photo-1500048993953-d23a436266cf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fHByb2ZpbGV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=50&q=60"},
    { id: "chat-u3", userId: "u3", name: "Sophie", lastMessage: "Vous avez un nouveau Facematch!", time: "Hier", unread: 0, profilePic: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=70&q=60"}

];

const anonymousHandles = ["Oiseau de Nuit", "Fêtard Discret", "Explorateur Sonore", "Visiteur Malin", "Connaisseur Anonyme", "Ambianceur Masqué"];

function getRandomAnonymousHandle(): string {
    return anonymousHandles[Math.floor(Math.random() * anonymousHandles.length)];
}


// Navigation
let currentScreenId = 'login-screen'; // Default to login screen
let screenHistory: string[] = ['login-screen']; // Default history
let currentPartyContext: Party | null = null; 
let currentViewedParticipantContext: User | null = null;
let navigationSourceForParticipantProfile: string | null = null; 
let selectedFriendsForPartyShare: string[] = [];


// AI Suggestion State
let currentAiSuggestionType: 'appealsToMe' | 'iAppealTo' | 'mutualMatch' = 'appealsToMe';

// Modal Management
function showModal(modalId: string) {
    const modal = document.getElementById(modalId);
    if (modal) {
        // Clear any previous feedback messages
        const feedbackEl = modal.querySelector('.modal-feedback');
        if (feedbackEl) feedbackEl.textContent = '';
        modal.style.display = 'flex';
         // Handle party share modal title
        if (modalId === 'share-party-modal' && currentPartyContext) {
            const titleEl = modal.querySelector('#share-party-modal-title');
            if (titleEl) titleEl.textContent = `Partager ${currentPartyContext.name}`;
            renderSharePartyModalFriendsList(); // Populate friends list when modal is shown
        }
    }
}

function closeModal(modalId: string) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        // Clear inputs in the modal if needed
        const inputs = modal.querySelectorAll('input');
        inputs.forEach(input => {
            if (input.type !== 'checkbox' && input.type !== 'radio') {
                 input.value = '';
            }
        });
        const verificationGroup = modal.querySelector('.form-group[id*="verification-code-group"]');
        if (verificationGroup) (verificationGroup as HTMLElement).style.display = 'none';

        // Clear feedback in share modal
        if (modalId === 'share-party-modal') {
            const feedbackEl = modal.querySelector('#share-party-feedback');
            if (feedbackEl) feedbackEl.textContent = '';
            selectedFriendsForPartyShare = []; // Reset selected friends
            const friendsListContainer = document.getElementById('share-party-friends-list');
            if (friendsListContainer) friendsListContainer.innerHTML = ''; // Clear list
        }
    }
}

function navigateTo(screenId: string, context?: any) {
    const currentActiveScreen = document.querySelector('.screen.active');
    if (currentActiveScreen) {
        currentActiveScreen.classList.remove('active');
    }
    
    const nextScreen = document.getElementById(screenId);
    if (nextScreen) {
        nextScreen.classList.add('active');
        if (screenId !== currentScreenId || screenHistory[screenHistory.length -1] !== screenId) {
             screenHistory.push(screenId);
        }
        currentScreenId = screenId;
        nextScreen.scrollTop = 0;
        
        const joinFriendButton = document.getElementById('btn-join-friend-at-party') as HTMLButtonElement;
        if (joinFriendButton) joinFriendButton.style.display = 'none';

        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        const activeNavItem = document.getElementById(`nav-${screenId.replace('-screen', '')}`);
        if(activeNavItem) activeNavItem.classList.add('active');


        if (screenId === 'login-screen') {
            renderLoginScreen();
        } else if (!isUserLoggedIn) { // If trying to navigate away from login but not logged in, redirect back
            navigateTo('login-screen');
            return;
        } else if (screenId === 'home-screen') {
            if (currentUser) {
                renderHomeScreen();
                 document.getElementById('nav-home')?.classList.add('active');
            } else navigateTo('login-screen'); // Should always have currentUser here
        } else if (context) {
            if (screenId === 'party-details-screen' && context.party) {
                renderPartyDetails(context.party, context.joiningFriendName);
            } else if (screenId === 'party-participants-screen' && context.party) {
                currentPartyContext = context.party; 
                renderPartyParticipants(context.party);
                const aiEngineArea = document.getElementById('ai-suggestion-engine-area');
                if (aiEngineArea) aiEngineArea.style.display = 'none';
                const aiSuggestionsList = document.getElementById('ai-suggestions-list-container');
                if (aiSuggestionsList) aiSuggestionsList.innerHTML = '';
                 const btnFinishAISuggestions = document.getElementById('btn-finish-ai-suggestions');
                if(btnFinishAISuggestions) btnFinishAISuggestions.style.display = 'none';


            } else if (screenId === 'chat-view-screen' && context.conversation) {
                renderChatView(context.conversation);
            } else if (screenId === 'participant-profile-screen' && context.participant) {
                currentViewedParticipantContext = context.participant;
                navigationSourceForParticipantProfile = context.source || null;
                renderParticipantProfileScreen(context.participant, navigationSourceForParticipantProfile);
            } else if (screenId === 'friends-attending-party-screen' && context.party) {
                currentPartyContext = context.party; 
                renderFriendsAttendingPartyScreen(context.party);
            } else if (screenId === 'party-rating-evolution-screen' && context.party) {
                 currentPartyContext = context.party; 
                renderPartyRatingEvolutionScreen(context.party);
            } else if (screenId === 'lineup-details-screen' && context.party) {
                currentPartyContext = context.party;
                renderLineupDetailsScreen(context.party);
            } else if (screenId === 'fp-visitors-history-screen' && context.party) {
                currentPartyContext = context.party;
                renderFpVisitorsHistoryScreen(context.party);
            } else if (screenId === 'send-party-to-friends-screen' && context.party) {
                currentPartyContext = context.party;
                renderSendPartyToFriendsScreen(context.party);
            }
        }

        if (isUserLoggedIn && currentUser) {
            if (screenId === 'profile-screen') {
                renderProfileScreen();
                document.getElementById('nav-profile')?.classList.add('active');
            }
            if (screenId === 'settings-screen') renderSettingsScreen();
            if (screenId === 'friends-screen') renderFriendsScreen();
            if (screenId === 'statistics-screen') renderStatisticsScreen();
            if (screenId === 'facelikes-screen') renderFacelikesScreen();
            if (screenId === 'facematches-today-screen') renderFacematchesTodayScreen();
            if (screenId === 'messaging-screen') {
                renderMessagingScreen();
                document.getElementById('nav-messages')?.classList.add('active');
            }
            if (screenId === 'new-chat-friends-screen') renderNewChatFriendsScreen();
             if (screenId === 'search-screen') {
                renderSearchScreen(); // Assuming you have this function
                document.getElementById('nav-search')?.classList.add('active');
            }
            
            // Settings sub-screens
            if (screenId === 'notifications-setting-screen') renderNotificationsSettingScreen();
            if (screenId === 'privacy-setting-screen') renderPrivacySettingScreen();
            if (screenId === 'account-setting-screen') renderAccountSettingScreen();
            if (screenId === 'help-setting-screen') renderHelpSettingScreen();
        }


    } else {
        console.error(`Screen with id ${screenId} not found.`);
        // Fallback to login if screen not found and not logged in, or home if logged in
        if (!isUserLoggedIn) navigateTo('login-screen');
        else navigateTo('home-screen');
    }
}

function goBack() {
    if (screenHistory.length > 1) {
        screenHistory.pop(); 
        const previousScreenId = screenHistory[screenHistory.length - 1];
        
        // Prevent going back to login screen via back button if logged in
        if (isUserLoggedIn && previousScreenId === 'login-screen' && screenHistory.length > 1) {
             screenHistory.pop(); // Pop login-screen
             const actualPreviousScreen = screenHistory[screenHistory.length - 1] || 'home-screen';
             navigateTo(actualPreviousScreen);
             return;
        }


        let previousContext = {};
         if (previousScreenId === 'party-participants-screen' && currentPartyContext) {
             previousContext = { party: currentPartyContext };
        } else if (previousScreenId === 'participant-profile-screen' && currentViewedParticipantContext) {
             previousContext = { participant: currentViewedParticipantContext, source: navigationSourceForParticipantProfile };
        } else if ((previousScreenId === 'party-details-screen' || previousScreenId === 'party-rating-evolution-screen' || previousScreenId === 'lineup-details-screen' || previousScreenId === 'fp-visitors-history-screen' || previousScreenId === 'send-party-to-friends-screen') && currentPartyContext) {
             previousContext = { party: currentPartyContext };
        } 
        navigateTo(previousScreenId, previousContext);
    } else {
        // If history is empty or only has one entry, go to home (if logged in) or login (if not)
        navigateTo(isUserLoggedIn && currentUser ? 'home-screen' : 'login-screen'); 
    }
}

// Rendering Functions

function renderLoginScreen() {
    const loginForm = document.getElementById('login-form') as HTMLFormElement;
    const createAccountForm = document.getElementById('create-account-form') as HTMLFormElement;
    const showCreateAccountLink = document.getElementById('show-create-account-link');
    const showLoginLink = document.getElementById('show-login-link');
    const forgotPasswordLink = document.getElementById('forgot-password-link');

    const loginFormContainer = document.getElementById('login-form-container');
    const createAccountFormContainer = document.getElementById('create-account-form-container');

    loginForm.removeEventListener('submit', handleLogin); // Remove previous to avoid duplicates
    loginForm.addEventListener('submit', handleLogin);

    createAccountForm.removeEventListener('submit', handleCreateAccount);
    createAccountForm.addEventListener('submit', handleCreateAccount);

    showCreateAccountLink?.removeEventListener('click', switchToCreate);
    showCreateAccountLink?.addEventListener('click', switchToCreate);
    
    showLoginLink?.removeEventListener('click', switchToLogin);
    showLoginLink?.addEventListener('click', switchToLogin);

    forgotPasswordLink?.removeEventListener('click', handleForgotPasswordLinkClick);
    forgotPasswordLink?.addEventListener('click', handleForgotPasswordLinkClick);


    function switchToCreate(e: Event) {
        e.preventDefault();
        if (loginFormContainer) loginFormContainer.style.display = 'none';
        if (createAccountFormContainer) createAccountFormContainer.style.display = 'block';
        const loginErrorEl = document.getElementById('login-error');
        if (loginErrorEl) loginErrorEl.textContent = '';
        const createAccountErrorEl = document.getElementById('create-account-error');
        if(createAccountErrorEl) createAccountErrorEl.textContent = '';
    }
    function switchToLogin(e: Event) {
        e.preventDefault();
        if (loginFormContainer) loginFormContainer.style.display = 'block';
        if (createAccountFormContainer) createAccountFormContainer.style.display = 'none';
        const loginErrorEl = document.getElementById('login-error');
        if (loginErrorEl) loginErrorEl.textContent = '';
        const createAccountErrorEl = document.getElementById('create-account-error');
        if(createAccountErrorEl) createAccountErrorEl.textContent = '';
    }
}

function handleLogin(event: Event) {
    event.preventDefault();
    const emailInput = document.getElementById('login-email') as HTMLInputElement;
    const passwordInput = document.getElementById('login-password') as HTMLInputElement;
    const errorEl = document.getElementById('login-error') as HTMLElement;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        errorEl.textContent = "Veuillez remplir tous les champs.";
        return;
    }

    const foundUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (foundUser) {
        isUserLoggedIn = true;
        currentUser = foundUser;
        currentUserId = foundUser.id;
        sessionStorage.setItem('isFacePartyLoggedIn', 'true');
        sessionStorage.setItem('facePartyCurrentUserId', foundUser.id);
        errorEl.textContent = '';
        
        // Ensure home screen is ready for the new user
        if (currentUser.pendingFacelikes) currentUser.faceLikes = currentUser.pendingFacelikes.length;
        if (currentUser.confirmedFacematches) currentUser.faceMatches = currentUser.confirmedFacematches.filter(fm => isToday(fm.dateMatched)).length;
        
        navigateTo('home-screen');
    } else {
        errorEl.textContent = "Email ou mot de passe incorrect.";
    }
}

function handleCreateAccount(event: Event) {
    event.preventDefault();
    const nameInput = document.getElementById('create-name') as HTMLInputElement;
    const emailInput = document.getElementById('create-email') as HTMLInputElement;
    const passwordInput = document.getElementById('create-password') as HTMLInputElement;
    const confirmPasswordInput = document.getElementById('create-confirm-password') as HTMLInputElement;
    const genderInput = document.getElementById('create-gender') as HTMLSelectElement;
    const ageInput = document.getElementById('create-age') as HTMLInputElement;
    const errorEl = document.getElementById('create-account-error') as HTMLElement;

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const gender = genderInput.value as 'male' | 'female' | 'other';
    const age = parseInt(ageInput.value);


    if (!name || !email || !password || !confirmPassword || !gender || !age) {
        errorEl.textContent = "Veuillez remplir tous les champs.";
        return;
    }
    if (password !== confirmPassword) {
        errorEl.textContent = "Les mots de passe ne correspondent pas.";
        return;
    }
    if (password.length < 6) {
        errorEl.textContent = "Le mot de passe doit comporter au moins 6 caractères.";
        return;
    }
    if (age < 18) {
        errorEl.textContent = "Vous devez avoir au moins 18 ans.";
        return;
    }
    if (allUsers.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        errorEl.textContent = "Cette adresse e-mail est déjà utilisée.";
        return;
    }

    const newUserId = `u-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newUser: User = ensureUserDetails({ // Use ensureUserDetails to populate all fields
        id: newUserId,
        name: name,
        age: age,
        bio: "Nouveau sur FaceParty !",
        profilePictureUrl: "", 
        profilePic: "", 
        faceMatches: 0,
        faceLikes: 0,
        favoriteDrink: "Eau",
        height: "Non spécifié",
        eyeColor: "Non spécifié",
        hairColor: "Non spécifié",
        nationality: "Non spécifié",
        gender: gender,
        country: "France", 
        email: email,
        password: password,
        statistics: { facelikesSent: 0, facelikesReceived: 0, facematches: 0, byParty: []},
        friends: [],
        friendRequestsReceived: [],
        friendRequestsSent: [],
        qrCodeData: "", 
        isGoingOut: false,
        pendingFacelikes: [],
        confirmedFacematches: [],
        privatePreferences: { selfDescription: "", partnerDescription: ""},
        phoneNumber: "", 
        notificationSettings: { messages: true, facelikes: true, facematches: true },
        privacySettings: { hideProfileInPartySearch: false, shareGoingOutStatus: true }
    });
    
    allUsers.push(newUser);

    isUserLoggedIn = true;
    currentUser = newUser;
    currentUserId = newUser.id;
    sessionStorage.setItem('isFacePartyLoggedIn', 'true');
    sessionStorage.setItem('facePartyCurrentUserId', newUser.id);
    errorEl.textContent = '';
    
    navigateTo('home-screen');
}

function handleForgotPasswordLinkClick(event: Event) {
    event.preventDefault();
    if (currentUser && currentUser.email) {
        (document.getElementById('forgot-password-email-display') as HTMLElement).textContent = currentUser.email;
        (document.getElementById('forgot-password-phone-display') as HTMLElement).textContent = currentUser.phoneNumber; // Assuming phone number is available
        showModal('forgot-password-modal');
    } else {
         alert("Veuillez d'abord entrer un email dans le champ de connexion pour la récupération de mot de passe.");
        const emailInput = document.getElementById('login-email') as HTMLInputElement;
        if(emailInput.value) {
            (document.getElementById('forgot-password-email-display') as HTMLElement).textContent = emailInput.value;
            // Potentially try to find user by this email to get phone, or leave phone blank
            const tempUser = allUsers.find(u => u.email === emailInput.value);
            (document.getElementById('forgot-password-phone-display') as HTMLElement).textContent = tempUser ? tempUser.phoneNumber : "Non disponible";
            showModal('forgot-password-modal');
        } else {
             alert("Veuillez entrer une adresse e-mail dans le champ de connexion avant de cliquer sur 'Mot de passe oublié'.");
        }
    }
}

function handleForgotPasswordSend(type: 'email' | 'phone') {
    const feedbackEl = document.getElementById('forgot-password-feedback');
    if (feedbackEl) {
        feedbackEl.textContent = `Instructions de réinitialisation envoyées à votre ${type === 'email' ? 'adresse e-mail' : 'numéro de téléphone'} (Simulation).`;
        feedbackEl.style.color = 'var(--success-color)';
    }
    setTimeout(() => {
        closeModal('forgot-password-modal');
    }, 2000);
}


function renderHomeScreen() {
    if (!currentUser) {
        navigateTo('login-screen'); 
        return;
    }
    (document.getElementById('home-cover-photo') as HTMLImageElement).src = currentUser.coverPhotoUrl!;
    (document.getElementById('home-profile-pic') as HTMLImageElement).src = currentUser.profilePictureUrl;
    document.getElementById('home-user-name')!.textContent = `${currentUser.name} ✔`;
    document.getElementById('home-user-bio')!.textContent = currentUser.bio;
    
    currentUser.faceLikes = currentUser.pendingFacelikes.length;
    currentUser.faceMatches = currentUser.confirmedFacematches.filter(fm => isToday(fm.dateMatched)).length;
    
    document.getElementById('home-facematch-count')!.textContent = currentUser.faceMatches.toString();
    document.getElementById('home-facelike-count')!.textContent = currentUser.faceLikes.toString();


    const partiesAroundCarousel = document.getElementById('parties-around-carousel')!;
    partiesAroundCarousel.innerHTML = partiesAround.map(party => `
        <div class="party-card" data-party-id="${party.id}" role="button" tabindex="0" aria-label="View details for ${party.name}">
            <img src="${party.imageUrl}" alt="${party.name}">
            <div class="party-card-info">
                <h3>${party.name}</h3>
                <p>${party.location.split(',')[0]}</p>
            </div>
        </div>
    `).join('');

    const pastPartiesCarousel = document.getElementById('past-parties-carousel')!;
    pastPartiesCarousel.innerHTML = pastParties.map(party => `
        <div class="party-card" data-party-id="${party.id}" role="button" tabindex="0" aria-label="View details for ${party.name}">
            <img src="${party.imageUrl}" alt="${party.name}">
            <div class="party-card-info">
                <h3>${party.name}</h3>
                <p>${party.time}</p>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.party-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const partyId = (e.currentTarget as HTMLElement).dataset.partyId;
            const party = [...partiesAround, ...pastParties].find(p => p.id === partyId);
            if (party) navigateTo('party-details-screen', { party });
        });
         card.addEventListener('keydown', (e) => {
            if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') {
                 const partyId = (e.currentTarget as HTMLElement).dataset.partyId;
                const party = [...partiesAround, ...pastParties].find(p => p.id === partyId);
                if (party) navigateTo('party-details-screen', { party });
            }
        });
    });
    
    const homeProfileTrigger = document.getElementById('home-profile-navigation-trigger');
    homeProfileTrigger?.removeEventListener('click', navigateToProfileScreenHandler);
    homeProfileTrigger?.addEventListener('click', navigateToProfileScreenHandler);
    homeProfileTrigger?.removeEventListener('keydown', navigateToProfileScreenKeyHandler);
    homeProfileTrigger?.addEventListener('keydown', navigateToProfileScreenKeyHandler);
}
function navigateToProfileScreenHandler() { navigateTo('profile-screen'); }
function navigateToProfileScreenKeyHandler(e: Event) {
    if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') {
        navigateTo('profile-screen');
    }
}


function populateSelect(selectElement: HTMLSelectElement, options: {label: string, value: string}[] | string[], currentValue?: string, defaultOptionText?: string) {
    selectElement.innerHTML = ''; // Clear existing options
    if (defaultOptionText) {
        const defaultOpt = document.createElement('option');
        defaultOpt.value = ""; 
        defaultOpt.textContent = defaultOptionText;
        selectElement.appendChild(defaultOpt);
    }
    options.forEach(opt => {
        const option = document.createElement('option');
        if (typeof opt === 'string') {
            option.value = opt;
            option.textContent = opt;
        } else { // It's an object {label, value}
            option.value = opt.value;
            option.textContent = opt.label;
        }
        if (option.value === currentValue) {
            option.selected = true;
        }
        selectElement.appendChild(option);
    });
}


let isEditingProfile = false;
function renderProfileScreen() {
    if (!currentUser) return;
    (document.getElementById('profile-main-pic') as HTMLImageElement).src = currentUser.profilePictureUrl;
    document.getElementById('profile-name-age')!.textContent = `${currentUser.name}, ${currentUser.age} ans`;
    
    const photoGrid = document.getElementById('profile-photo-grid')!;
    photoGrid.innerHTML = (currentUser.photos || []).map(photoUrl => `<img src="${photoUrl}" alt="User photo">`).join('');

    const editButton = document.getElementById('edit-profile-info-button')!;
    
    const fieldsToEdit = [
        { id: 'profile-favorite-drink', label: 'Boisson Favorite', value: currentUser.favoriteDrink, containerId: 'profile-favorite-drink-container', iconClass: 'fas fa-martini-glass', type: 'text', originalKey: 'favoriteDrink' },
        { id: 'profile-bio-text', label: 'Bio', value: currentUser.bio, containerId: 'profile-bio-container', type: 'textarea', originalKey: 'bio'},
        { id: 'profile-height', label: 'Taille', value: currentUser.height, containerId: 'profile-height-container', type: 'text', originalKey: 'height' }, // Keep as text for now, could be improved
        { id: 'profile-eye-color', label: 'Couleur des yeux', value: currentUser.eyeColor, containerId: 'profile-eye-color-container', type: 'select', originalKey: 'eyeColor', options: EYE_COLORS },
        { id: 'profile-hair-color', label: 'Couleur des cheveux', value: currentUser.hairColor, containerId: 'profile-hair-color-container', type: 'select', originalKey: 'hairColor', options: HAIR_COLORS },
        { id: 'profile-nationality', label: 'Nationalité', value: currentUser.nationality, containerId: 'profile-nationality-container', type: 'text', originalKey: 'nationality' },
    ];
    
    const privateSelfDescContainer = document.getElementById('profile-private-self-desc-container')!;
    const privatePartnerDescContainer = document.getElementById('profile-private-partner-desc-container')!;
    const genderContainer = document.getElementById('profile-gender-container')!;
    const detailedGenderContainer = document.getElementById('profile-detailed-gender-container')!;

    if (isEditingProfile) {
        // Gender editing
        genderContainer.innerHTML = `
            <label for="edit-profile-gender">Genre:</label>
            <select id="edit-profile-gender" aria-label="Select your gender">
                <option value="male" ${currentUser.gender === 'male' ? 'selected' : ''}>Masculin</option>
                <option value="female" ${currentUser.gender === 'female' ? 'selected' : ''}>Féminin</option>
                <option value="other" ${currentUser.gender === 'other' ? 'selected' : ''}>Autre</option>
            </select>`;
        
        detailedGenderContainer.innerHTML = `
            <label for="edit-profile-detailed-gender">Genre détaillé (si "Autre"):</label>
            <select id="edit-profile-detailed-gender" aria-label="Select your detailed gender identity"></select>`;
        const detailedGenderSelect = detailedGenderContainer.querySelector('#edit-profile-detailed-gender') as HTMLSelectElement;
        populateSelect(detailedGenderSelect, LGBT_GENDERS, currentUser.detailedGender, "Choisir...");
        detailedGenderContainer.style.display = currentUser.gender === 'other' ? 'block' : 'none';

        document.getElementById('edit-profile-gender')?.addEventListener('change', (e) => {
            detailedGenderContainer.style.display = (e.target as HTMLSelectElement).value === 'other' ? 'block' : 'none';
        });

        fieldsToEdit.forEach(field => {
            const container = document.getElementById(field.containerId)!;
            if (field.type === 'textarea') {
                 container.innerHTML = `<label for="edit-${field.id}">${field.label}:</label><textarea id="edit-${field.id}" rows="3" aria-label="${field.label}">${field.value}</textarea>`;
            } else if (field.type === 'select' && field.options) {
                container.innerHTML = `<label for="edit-${field.id}">${field.label}:</label><select id="edit-${field.id}" aria-label="${field.label}"></select>`;
                populateSelect(container.querySelector('select')!, field.options as string[], field.value);
            }
            else { // text input
                 container.innerHTML = `<label for="edit-${field.id}">${field.label}:</label><input type="text" id="edit-${field.id}" value="${field.value}" aria-label="${field.label}">`;
            }
        });
        privateSelfDescContainer.innerHTML = `<label for="edit-profile-private-self-desc"><strong>Comment je suis (privé):</strong></label><textarea id="edit-profile-private-self-desc" rows="4" placeholder="Décrivez votre personnalité..." aria-label="My private self description">${currentUser.privatePreferences.selfDescription}</textarea>`;
        privatePartnerDescContainer.innerHTML = `<label for="edit-profile-private-partner-desc"><strong>Ce que je recherche (privé):</strong></label><textarea id="edit-profile-private-partner-desc" rows="4" placeholder="Décrivez votre personne idéale..." aria-label="My private partner preferences">${currentUser.privatePreferences.partnerDescription}</textarea>`;
        editButton.textContent = 'Sauvegarder';
        editButton.classList.add('save-button'); 
    } else {
        // Display mode
        genderContainer.innerHTML = `<p><strong>Genre:</strong> <span id="profile-gender-display">${currentUser.gender.charAt(0).toUpperCase() + currentUser.gender.slice(1)}</span></p>`;
        if (currentUser.gender === 'other' && currentUser.detailedGender) {
            detailedGenderContainer.innerHTML = `<p><strong>Genre détaillé:</strong> <span id="profile-detailed-gender-display">${currentUser.detailedGender}</span></p>`;
            detailedGenderContainer.style.display = 'block';
        } else {
            detailedGenderContainer.style.display = 'none';
        }

        fieldsToEdit.forEach(field => {
            const container = document.getElementById(field.containerId)!;
            let content = '';
            if (field.iconClass) { // For favorite drink, etc.
                content = `<i class="${field.iconClass}"></i> <span id="${field.id}">${field.value}</span>`;
                 if (field.id === 'profile-favorite-drink') { // Center only favorite drink
                    container.innerHTML = content;
                    container.style.textAlign = 'center';
                    return; 
                }
            } else if (field.label === 'Bio') {
                 content = `<p><strong>${field.label}:</strong> <span id="${field.id}">${field.value}</span></p>`;
            } 
            else {
                content = `<p><strong>${field.label}:</strong> <span id="${field.id}">${field.value}</span></p>`;
            }
            container.innerHTML = content;
            container.style.textAlign = 'left'; // Ensure other fields are left-aligned
        });
        privateSelfDescContainer.innerHTML = `<p><strong>Comment je suis (privé):</strong></p><p class="profile-private-text">${currentUser.privatePreferences.selfDescription || "Non défini"}</p>`;
        privatePartnerDescContainer.innerHTML = `<p><strong>Ce que je recherche (privé):</strong></p><p class="profile-private-text">${currentUser.privatePreferences.partnerDescription || "Non défini"}</p>`;
        editButton.textContent = 'Modifier les informations';
        editButton.classList.remove('save-button');
    }
}

function toggleProfileEdit() {
    if (!currentUser) return;
    if (isEditingProfile) { 
        // Save Gender
        const genderInput = document.getElementById('edit-profile-gender') as HTMLSelectElement;
        currentUser.gender = genderInput.value as 'male' | 'female' | 'other';
        if (currentUser.gender === 'other') {
            const detailedGenderInput = document.getElementById('edit-profile-detailed-gender') as HTMLSelectElement;
            currentUser.detailedGender = detailedGenderInput.value || undefined;
        } else {
            currentUser.detailedGender = undefined;
        }

        const fieldsToSave = [
            { id: 'profile-favorite-drink', originalKey: 'favoriteDrink' },
            { id: 'profile-bio-text', originalKey: 'bio' },
            { id: 'profile-height', originalKey: 'height' },
            { id: 'profile-eye-color', originalKey: 'eyeColor' },
            { id: 'profile-hair-color', originalKey: 'hairColor' },
            { id: 'profile-nationality', originalKey: 'nationality' },
        ];
        fieldsToSave.forEach(field => {
            const inputElement = document.getElementById(`edit-${field.id}`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
            if (inputElement) {
                (currentUser as any)[field.originalKey] = inputElement.value;
            }
        });
        // Save private preferences
        const selfDescInput = document.getElementById('edit-profile-private-self-desc') as HTMLTextAreaElement;
        const partnerDescInput = document.getElementById('edit-profile-private-partner-desc') as HTMLTextAreaElement;
        if (selfDescInput) currentUser.privatePreferences.selfDescription = selfDescInput.value;
        if (partnerDescInput) currentUser.privatePreferences.partnerDescription = partnerDescInput.value;

        isEditingProfile = false;
        renderHomeScreen(); 
    } else { 
        isEditingProfile = true;
    }
    renderProfileScreen(); 
}


function renderSearchScreen() {
    const resultsContainer = document.getElementById('search-results-list')!;
    resultsContainer.innerHTML = partiesAround.slice(0, 3).map(party => `
        <div class="search-result-item" data-party-id="${party.id}" role="button" tabindex="0" aria-label="View details for ${party.name}">
            <h3>${party.name}</h3>
            <p><i class="fas fa-map-marker-alt"></i> ${party.location}</p>
            <p><i class="fas fa-clock"></i> ${party.time}</p>
            <p><i class="fas fa-tshirt"></i> ${party.dressCode}</p>
            <p><i class="fas fa-music"></i> ${party.music}</p>
        </div>
    `).join('');
     document.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const partyId = (e.currentTarget as HTMLElement).dataset.partyId;
            const party = partiesAround.find(p => p.id === partyId);
            if (party) navigateTo('party-details-screen', { party });
        });
         item.addEventListener('keydown', (e) => {
            if((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') {
                const partyId = (e.currentTarget as HTMLElement).dataset.partyId;
                const party = partiesAround.find(p => p.id === partyId);
                if (party) navigateTo('party-details-screen', { party });
            }
        });
    });
}

function renderPartyDetails(party: Party, joiningFriendName?: string) {
    if (!currentUser) { navigateTo('login-screen'); return; }
    currentPartyContext = party; 
    document.getElementById('party-details-name')!.textContent = party.name;
    (document.getElementById('party-details-banner') as HTMLImageElement).src = party.media && party.media.length > 0 ? party.media[0] : party.imageUrl;
    
    const mediaGallery = document.getElementById('party-media-gallery')!;
    if (party.media && party.media.length > 0) {
        mediaGallery.innerHTML = party.media.map((mediaUrl: string) => `<img src="${mediaUrl}" alt="Party media" role="img">`).join('');
        mediaGallery.style.display = 'flex';
    } else {
        mediaGallery.innerHTML = '';
        mediaGallery.style.display = 'none';
    }

    document.getElementById('party-details-title-date')!.textContent = `${party.name.toUpperCase()} - ${party.time.split('-')[0]}, ${party.date}`;
    document.getElementById('party-details-address')!.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${party.location}`;
    
    const totalFpVisitorsText = document.getElementById('party-details-total-fp-visitors-text')!;
    totalFpVisitorsText.textContent = `${party.totalFacePartyVisitorsEver} FP Visiteurs (historique)`;
    const totalFpVisitorsTrigger = document.getElementById('party-details-total-fp-visitors-trigger')!;
    const newTotalFpVisitorsTrigger = totalFpVisitorsTrigger.cloneNode(true) as HTMLElement;
    totalFpVisitorsTrigger.parentNode!.replaceChild(newTotalFpVisitorsTrigger, totalFpVisitorsTrigger);
    newTotalFpVisitorsTrigger.addEventListener('click', () => navigateTo('fp-visitors-history-screen', { party }));


    const averageRatingSpan = document.getElementById('party-details-average-rating')!;
    averageRatingSpan.textContent = `${party.rating.toFixed(1)} / 5`;
    const ratingTrigger = document.getElementById('party-details-average-rating-trigger')!;
    const newRatingTrigger = ratingTrigger.cloneNode(true) as HTMLElement; 
    ratingTrigger.parentNode!.replaceChild(newRatingTrigger, ratingTrigger);
    newRatingTrigger.addEventListener('click', () => navigateTo('party-rating-evolution-screen', { party }));


    document.getElementById('party-details-ambiance')!.textContent = party.music;
    document.getElementById('party-details-dresscode')!.textContent = party.dressCode;
    document.getElementById('party-details-selectivity')!.textContent = party.selectivity;
    document.getElementById('party-details-fp-count')!.textContent = party.fpCount.toString();

    const lineupDetailsButton = document.getElementById('btn-view-lineup-details');
    if (lineupDetailsButton) {
        const newLineupButton = lineupDetailsButton.cloneNode(true) as HTMLButtonElement;
        lineupDetailsButton.parentNode?.replaceChild(newLineupButton, lineupDetailsButton);
        newLineupButton.addEventListener('click', () => navigateTo('lineup-details-screen', {party}));
    }


    const attendingFriends = allUsers.filter(u => 
        currentUser!.friends.includes(u.id) && // currentUser should be non-null here
        u.isGoingOut &&
        u.goingOutToPartyId === party.id
    );
    const numberOfAttendingFriends = attendingFriends.length;

    const attendeesShortSpan = document.getElementById('party-details-attendees-short')!;
    if (numberOfAttendingFriends > 0) {
        const friendNames = attendingFriends.map(f => f.name.split(' ')[0]); 
        let namesText = "";
        if (friendNames.length <= 2) { 
            namesText = friendNames.join(', ');
        } else { 
            namesText = `${friendNames.slice(0, 2).join(', ')}...`;
        }
        attendeesShortSpan.textContent = `${namesText} (${numberOfAttendingFriends} ami${numberOfAttendingFriends > 1 ? 's' : ''})`;
    } else {
        attendeesShortSpan.textContent = "Aucun de vos amis.";
    }

    const attendeesClickableTrigger = document.getElementById('party-details-attendees-clickable-trigger')!;
    const newAttendeesClickableTrigger = attendeesClickableTrigger.cloneNode(true) as HTMLElement; 
    attendeesClickableTrigger.parentNode!.replaceChild(newAttendeesClickableTrigger, attendeesClickableTrigger);
    if (numberOfAttendingFriends > 0) {
        newAttendeesClickableTrigger.addEventListener('click', () => {
            navigateTo('friends-attending-party-screen', { party });
        });
        newAttendeesClickableTrigger.style.cursor = 'pointer';
    } else {
        newAttendeesClickableTrigger.style.cursor = 'default';
        newAttendeesClickableTrigger.onclick = null; // Remove listener if no friends
    }


    const oldJoinPartyButton = document.getElementById('btn-join-party') as HTMLButtonElement;
    const newJoinPartyButton = oldJoinPartyButton.cloneNode(true) as HTMLButtonElement; 
    oldJoinPartyButton.parentNode!.replaceChild(newJoinPartyButton, oldJoinPartyButton);
    newJoinPartyButton.addEventListener('click', () => handleJoinParty(party));

    const joinFriendButton = document.getElementById('btn-join-friend-at-party') as HTMLButtonElement;
    if (joiningFriendName && currentUser) {
        joinFriendButton.textContent = `Rejoindre ${joiningFriendName}`;
        joinFriendButton.style.display = 'block';
        const newJoinFriendButton = joinFriendButton.cloneNode(true) as HTMLButtonElement;
        joinFriendButton.parentNode!.replaceChild(newJoinFriendButton, joinFriendButton);
        newJoinFriendButton.onclick = () => {
            alert(`Vous rejoignez ${joiningFriendName} à ${party.name}!`);
            currentUser!.isGoingOut = true;
            currentUser!.goingOutToPartyId = party.id;
            currentUser!.goingOutToPartyName = party.name;
            renderHomeScreen();
            navigateTo('party-participants-screen', { party });
        };
    } else {
        joinFriendButton.style.display = 'none';
    }

    // Share button functionality
    const shareButton = document.getElementById('party-details-share-button')!;
    const newShareButton = shareButton.cloneNode(true) as HTMLButtonElement;
    shareButton.parentNode!.replaceChild(newShareButton, shareButton);
    newShareButton.addEventListener('click', () => showModal('share-party-modal'));

    // Send to friends button
    const sendToFriendsButton = document.getElementById('btn-send-party-to-friends');
    if (sendToFriendsButton) {
        const newSendToFriendsButton = sendToFriendsButton.cloneNode(true) as HTMLButtonElement;
        sendToFriendsButton.parentNode?.replaceChild(newSendToFriendsButton, sendToFriendsButton);
        newSendToFriendsButton.addEventListener('click', () => navigateTo('send-party-to-friends-screen', {party}));
    }
}

function renderSharePartyModalFriendsList() {
    if (!currentUser) return;
    const friendsListContainer = document.getElementById('share-party-friends-list');
    if (!friendsListContainer) return;

    const friends = currentUser.friends.map(id => allUsers.find(u => u.id === id)).filter(Boolean) as User[];
    if (friends.length === 0) {
        friendsListContainer.innerHTML = "<p>Vous n'avez aucun ami à qui partager.</p>";
        return;
    }
    friendsListContainer.innerHTML = friends.map(friend => `
        <div class="share-friend-item">
            <input type="checkbox" id="share-friend-${friend.id}" value="${friend.id}" name="shareFriend" 
                   ${selectedFriendsForPartyShare.includes(friend.id) ? 'checked' : ''} aria-labelledby="share-friend-label-${friend.id}">
            <label for="share-friend-${friend.id}" id="share-friend-label-${friend.id}">
                <img src="${friend.profilePic}" alt="${friend.name}">
                <span>${friend.name}</span>
            </label>
        </div>
    `).join('');

    friendsListContainer.querySelectorAll('input[name="shareFriend"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const friendId = (e.target as HTMLInputElement).value;
            if ((e.target as HTMLInputElement).checked) {
                if (!selectedFriendsForPartyShare.includes(friendId)) {
                    selectedFriendsForPartyShare.push(friendId);
                }
            } else {
                selectedFriendsForPartyShare = selectedFriendsForPartyShare.filter(id => id !== friendId);
            }
        });
    });
}

function handleSharePartySubmit() {
    const feedbackEl = document.getElementById('share-party-feedback');
    if (!feedbackEl || !currentUser || !currentPartyContext) return;

    if (selectedFriendsForPartyShare.length === 0) {
        feedbackEl.textContent = "Veuillez sélectionner au moins un ami.";
        feedbackEl.style.color = 'var(--danger-color)';
        return;
    }

    selectedFriendsForPartyShare.forEach(friendId => {
        const friend = allUsers.find(u => u.id === friendId);
        if (friend) {
            // Find or create conversation
            let conversation = mockConversations.find(c => c.userId === friendId && c.id.startsWith(`chat-${currentUser!.id}-${friendId}`) || c.id.startsWith(`chat-${friendId}-${currentUser!.id}`));
            if (!conversation) {
                 conversation = {
                    id: `chat-${currentUser!.id}-${friendId}-${Date.now()}`, // Unique ID
                    userId: friendId, // This is the recipient of the share
                    name: friend.name,
                    lastMessage: `Soirée partagée: ${currentPartyContext!.name}`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    unread: 1,
                    profilePic: friend.profilePic,
                    partyShare: { partyId: currentPartyContext!.id, partyName: currentPartyContext!.name }
                };
                mockConversations.unshift(conversation);
            } else {
                conversation.lastMessage = `Soirée partagée: ${currentPartyContext!.name}`;
                conversation.time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                conversation.unread = (conversation.unread || 0) + 1;
                conversation.partyShare = { partyId: currentPartyContext!.id, partyName: currentPartyContext!.name };
                mockConversations = [conversation, ...mockConversations.filter(c => c.id !== conversation!.id)];
            }
            if (friend.notificationSettings.messages) {
                console.log(`Simulated notification to ${friend.name} about shared party: ${currentPartyContext!.name}`);
            }
        }
    });

    feedbackEl.textContent = `Soirée partagée avec ${selectedFriendsForPartyShare.length} ami(s)!`;
    feedbackEl.style.color = 'var(--success-color)';
    renderMessagingScreen(); 

    setTimeout(() => {
        closeModal('share-party-modal');
    }, 1500);
}


function renderPartyComments(party: Party, targetListElementId: string) {
    const commentsList = document.getElementById(targetListElementId)!;
    if (!party.comments || party.comments.length === 0) {
        commentsList.innerHTML = "<p>Aucun avis pour le moment. Soyez le premier !</p>";
        return;
    }
    const sortedComments = [...party.comments].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    commentsList.innerHTML = sortedComments.map(comment => `
        <div class="review-card">
            <div class="review-card-header">
                <span class="review-author">${comment.anonymousUserHandle}</span>
                <span class="review-timestamp">${formatTimestamp(comment.timestamp)}</span>
            </div>
            <p class="review-text">${comment.text}</p>
        </div>
    `).join('');
}

function handlePartyCommentSubmit(party: Party, inputElementId: string, listElementId: string) {
    const commentInput = document.getElementById(inputElementId) as HTMLTextAreaElement;
    const commentText = commentInput.value.trim();

    if (!commentText) {
        alert("Veuillez écrire un commentaire.");
        return;
    }

    const newComment = {
        id: `cmt-${Date.now()}`,
        text: commentText,
        timestamp: new Date().toISOString(),
        anonymousUserHandle: getRandomAnonymousHandle()
    };
    
    const partyInAroundIndex = partiesAround.findIndex(p => p.id === party.id);
    if (partyInAroundIndex > -1) {
        partiesAround[partyInAroundIndex].comments.push(newComment);
    } else {
        const partyInPastIndex = pastParties.findIndex(p => p.id === party.id);
        if (partyInPastIndex > -1) {
             pastParties[partyInPastIndex].comments.push(newComment);
        } else {
            console.error("Party not found for comment submission in original arrays.");
            return;
        }
    }
     if(currentPartyContext && currentPartyContext.id === party.id) {
        currentPartyContext.comments.push(newComment);
    }

    renderPartyComments(party, listElementId); 
    commentInput.value = ""; 
}

function renderPartyRatingEvolutionScreen(party: Party) {
    document.getElementById('party-rating-evolution-title')!.textContent = `Avis & Évolution - ${party.name}`;
    const monthlyRatingsList = document.getElementById('monthly-ratings-list')!;

    if (!party.monthlyRatings || party.monthlyRatings.length === 0) {
        monthlyRatingsList.innerHTML = "<p style='text-align:center; padding: 10px 0; color: var(--text-secondary);'>Aucune donnée d'évolution des notes disponible.</p>";
    } else {
        const monthOrder = ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin", "Juil", "Aou", "Sep", "Oct", "Nov", "Dec"];
        const sortedRatings = [...party.monthlyRatings].sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
        });
        monthlyRatingsList.innerHTML = sortedRatings.map(mr => `
            <div class="monthly-rating-item">
                <span class="month-year">${mr.month} ${mr.year}</span>
                <span class="rating-value">
                    <i class="fas fa-star"></i> ${mr.rating.toFixed(1)} / 5
                </span>
            </div>
        `).join('');
    }
    
    renderPartyComments(party, 'anonymous-reviews-list');

    const submitCommentButton = document.getElementById('submit-anonymous-review-button')!;
    const newSubmitCommentButton = submitCommentButton.cloneNode(true) as HTMLButtonElement; 
    submitCommentButton.parentNode!.replaceChild(newSubmitCommentButton, submitCommentButton);
    newSubmitCommentButton.addEventListener('click', () => handlePartyCommentSubmit(party, 'new-anonymous-review-input', 'anonymous-reviews-list'));
}


function renderFriendsAttendingPartyScreen(party: Party) {
    if (!currentUser) { navigateTo('login-screen'); return; }
    document.getElementById('friends-attending-party-title')!.textContent = `Amis à ${party.name}`;
    const listContainer = document.getElementById('friends-attending-party-list')!;

    const friendsAtParty = allUsers.filter(u =>
        currentUser!.friends.includes(u.id) &&
        u.isGoingOut &&
        u.goingOutToPartyId === party.id
    );

    if (friendsAtParty.length === 0) {
        listContainer.innerHTML = "<p class='empty-list-message'>Aucun de vos amis ne participe à cette soirée.</p>";
        return;
    }

    listContainer.innerHTML = friendsAtParty.map(friend => `
        <div class="friend-item friend-attending-item" data-user-id="${friend.id}" role="button" tabindex="0" aria-label="View profile of ${friend.name}">
            <img src="${friend.profilePic}" alt="${friend.name}" class="friend-attending-pic">
            <span class="friend-attending-name">${friend.name}</span>
            <i class="fas fa-chevron-right friend-attending-chevron"></i>
        </div>
    `).join('');

    listContainer.querySelectorAll('.friend-item.friend-attending-item').forEach(item => {
        item.addEventListener('click', () => {
            const userId = (item as HTMLElement).dataset.userId;
            const user = allUsers.find(u => u.id === userId);
            if (user) {
                navigateTo('participant-profile-screen', { participant: user, source: 'friends-attending-party' });
            }
        });
         item.addEventListener('keydown', (e) => {
            if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') {
                 const userId = (item as HTMLElement).dataset.userId;
                const user = allUsers.find(u => u.id === userId);
                if (user) {
                    navigateTo('participant-profile-screen', { participant: user, source: 'friends-attending-party' });
                }
            }
        });
    });
}


function handleJoinParty(party: Party) {
    if (!currentUser) { navigateTo('login-screen'); return; }
    currentUser.isGoingOut = true;
    currentUser.goingOutToPartyId = party.id;
    currentUser.goingOutToPartyName = party.name;
    renderHomeScreen(); 
    navigateTo('party-participants-screen', { party });
}

function updateSelectedAgeRangesButtonText() {
    const ageButton = document.getElementById('filter-age-button') as HTMLButtonElement;
    const checkboxes = document.querySelectorAll('#filter-age-checkboxes-list input[type="checkbox"]:checked') as NodeListOf<HTMLInputElement>;
    const selectedLabels = Array.from(checkboxes).map(cb => {
        const foundRange = AGE_RANGES_CONFIG.find(r => r.id === cb.id);
        return foundRange ? foundRange.label : '';
    }).filter(Boolean);

    if (selectedLabels.length === 0) {
        ageButton.textContent = 'Âge (Tous)';
    } else if (selectedLabels.length <= 2) {
        ageButton.textContent = `Âge (${selectedLabels.join(', ')})`;
    } else {
        ageButton.textContent = `Âge (${selectedLabels.length} sélections)`;
    }
}


function renderPartyParticipants(party: Party) {
    if (!currentUser) { navigateTo('login-screen'); return; }
    document.getElementById('participants-party-name')!.textContent = party.name;
    document.getElementById('participants-total-people')!.textContent = (party.currentViewers || 0).toString();
    document.getElementById('participants-closing-time')!.textContent = party.time.split('-')[1] || "N/A";

    // Populate filter options if not already done
    const eyeColorSelect = document.getElementById('filter-eye-color') as HTMLSelectElement;
    if (eyeColorSelect.options.length <=1 ) { 
        populateSelect(eyeColorSelect, EYE_COLORS, undefined, "Yeux (Tous)");
    }
    const hairColorSelect = document.getElementById('filter-hair-color') as HTMLSelectElement;
     if (hairColorSelect.options.length <=1 ) {
        populateSelect(hairColorSelect, HAIR_COLORS, undefined, "Cheveux (Tous)");
    }
    const heightSelect = document.getElementById('filter-height') as HTMLSelectElement;
    if (heightSelect.options.length <=1) {
        populateSelect(heightSelect, HEIGHT_OPTIONS_CONFIG.map(h => ({label: h.label, value: h.value})), undefined, "Taille (Toutes)");
    }


    const ageCheckboxesList = document.getElementById('filter-age-checkboxes-list')!;
    if (ageCheckboxesList.childElementCount === 0) {
        AGE_RANGES_CONFIG.forEach(range => {
            const div = document.createElement('div');
            div.className = 'filter-age-checkbox-item';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = range.id;
            checkbox.value = range.label;
            checkbox.setAttribute('aria-labelledby', `label-for-${range.id}`);
            checkbox.addEventListener('change', () => {
                updateSelectedAgeRangesButtonText();
                renderPartyParticipants(party);
            });
            const label = document.createElement('label');
            label.htmlFor = range.id;
            label.id = `label-for-${range.id}`;
            label.textContent = range.label;
            div.appendChild(checkbox);
            div.appendChild(label);
            ageCheckboxesList.appendChild(div);
        });
    }
    updateSelectedAgeRangesButtonText();


    const genderFilter = (document.getElementById('filter-gender') as HTMLSelectElement).value;
    const specificGenderFilterContainer = document.getElementById('filter-specific-gender-container')!;
    const specificGenderSelect = document.getElementById('filter-specific-gender') as HTMLSelectElement;

    if (genderFilter === 'other') {
        specificGenderFilterContainer.style.display = 'block';
        if (specificGenderSelect.options.length <=1) { 
             populateSelect(specificGenderSelect, LGBT_GENDERS, undefined, "Tous (Autres)");
        }
    } else {
        specificGenderFilterContainer.style.display = 'none';
    }
    const specificGenderValue = (genderFilter === 'other' && specificGenderSelect.value !== "") ? specificGenderSelect.value : null;


    // Get selected age ranges
    const selectedAgeRanges: string[] = [];
    document.querySelectorAll('#filter-age-checkboxes-list input[type="checkbox"]:checked').forEach(cb => {
        selectedAgeRanges.push((cb as HTMLInputElement).value);
    });

    const countryFilter = (document.getElementById('filter-country') as HTMLInputElement).value.toLowerCase();
    const heightFilterValue = (document.getElementById('filter-height') as HTMLSelectElement).value;
    const eyeColorFilter = (document.getElementById('filter-eye-color') as HTMLSelectElement).value;
    const hairColorFilter = (document.getElementById('filter-hair-color') as HTMLSelectElement).value;


    let filteredParticipants = allUsers.filter(p => {
        if (p.id === currentUser!.id) return false; 
        if (!p.isGoingOut || p.goingOutToPartyId !== party.id) return false;
        if (p.privacySettings.hideProfileInPartySearch && p.goingOutToPartyId !== currentUser!.goingOutToPartyId) return false;

        let match = true;
        if (genderFilter !== 'all') {
            if (genderFilter === 'other') {
                if (p.gender !== 'other') match = false;
                if (specificGenderValue && p.detailedGender !== specificGenderValue) match = false;
            } else {
                if (p.gender !== genderFilter) match = false;
            }
        }
        
        if (selectedAgeRanges.length > 0) {
            let ageMatch = false;
            for (const rangeLabel of selectedAgeRanges) {
                const rangeConfig = AGE_RANGES_CONFIG.find(r => r.label === rangeLabel);
                if (rangeConfig && p.age >= rangeConfig.min && p.age <= rangeConfig.max) {
                    ageMatch = true;
                    break;
                }
            }
            if (!ageMatch) match = false;
        }

        if (countryFilter && !p.country.toLowerCase().includes(countryFilter)) match = false;
        
        if (heightFilterValue !== "" && heightFilterValue !== "all") {
            const heightNum = parseInt(p.height); 
            const selectedHeightConfig = HEIGHT_OPTIONS_CONFIG.find(hOpt => hOpt.value === heightFilterValue);
            if (selectedHeightConfig && heightNum < selectedHeightConfig.min) {
                match = false;
            }
        }

        if (eyeColorFilter !== "" && p.eyeColor !== eyeColorFilter) match = false;
        if (hairColorFilter !== "" && p.hairColor !== hairColorFilter) match = false;

        return match;
    });

    document.getElementById('participants-fp-count')!.textContent = filteredParticipants.length.toString();

    const listContainer = document.getElementById('participants-list')!;
    listContainer.innerHTML = filteredParticipants.map(p => `
        <div class="participant-card">
            <div class="participant-card-clickable-area" data-user-id="${p.id}" role="button" tabindex="0" aria-label="View profile of ${p.name}">
                <img src="${p.profilePic}" alt="${p.name}">
                <div class="participant-info">
                    <h3>${p.name}, ${p.age}</h3>
                    <p class="drink"><i class="fas fa-cocktail"></i> ${p.favoriteDrink.toUpperCase()}</p>
                    <p class="bio">"${p.bio}"</p>
                </div>
            </div>
            <button class="facelike-button-participant-card ${p.isFaceliked ? 'liked' : ''}" data-user-id="${p.id}" aria-label="Facelike ${p.name}">
                <i class="${p.isFaceliked ? 'fas' : 'far'} fa-heart"></i>
            </button>
        </div>
    `).join('');
    
    listContainer.querySelectorAll('.participant-card-clickable-area').forEach(card => {
        card.addEventListener('click', (e) => {
            const userId = (e.currentTarget as HTMLElement).dataset.userId;
            const participant = allUsers.find(p => p.id === userId);
            if (participant) navigateTo('participant-profile-screen', { participant, source: 'participants-list' });
        });
        card.addEventListener('keydown', (e) => {
            if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') {
                const userId = (e.currentTarget as HTMLElement).dataset.userId;
                const participant = allUsers.find(p => p.id === userId);
                if (participant) navigateTo('participant-profile-screen', { participant, source: 'participants-list' });
            }
        });
    });

    listContainer.querySelectorAll('.facelike-button-participant-card').forEach(button => {
        button.addEventListener('click', (e) => {
            const userId = (e.currentTarget as HTMLElement).dataset.userId;
            toggleFacelike(userId!, 'participants-list');
        });
    });
}

function toggleFacelike(userIdToLike: string, source: 'participants-list' | 'participant-profile' | 'friend-profile' | 'ai-suggestions') {
    if (!currentUser) { navigateTo('login-screen'); return; }
    const likedUserIndex = allUsers.findIndex(u => u.id === userIdToLike);
    if (likedUserIndex === -1) return;

    const likedUser = allUsers[likedUserIndex];
    likedUser.isFaceliked = !likedUser.isFaceliked; 

    const currentUserStats = ensureStatistics(currentUser);
    const likedUserStats = ensureStatistics(likedUser);

    const partyIdForLike = ( (source === 'participants-list' || source === 'ai-suggestions') && currentPartyContext) ? currentPartyContext.id : undefined;
    const partyNameForLike = ( (source === 'participants-list' || source === 'ai-suggestions') && currentPartyContext) ? currentPartyContext.name : "Profil Direct";

    if (likedUser.isFaceliked) { 
        currentUserStats.facelikesSent++;

        const newPendingLike: PendingFacelike = {
            id: `pfl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            userId: currentUser.id,
            name: currentUser.name,
            profilePic: currentUser.profilePic,
            partyId: partyIdForLike || '', 
            partyName: partyNameForLike,
            dateReceived: new Date().toISOString(),
        };
        likedUser.pendingFacelikes.push(newPendingLike);
        likedUser.faceLikes = likedUser.pendingFacelikes.length; 

        likedUserStats.facelikesReceived++;
        let likedUserPartyStat = likedUserStats.byParty.find(p => p.partyName === partyNameForLike);
        if (likedUserPartyStat) {
            likedUserPartyStat.flReceived++;
        } else {
            likedUserStats.byParty.push({ partyName: partyNameForLike, flReceived: 1, flSent: 0, fm: 0 });
        }

        let currentUserPartyStat = currentUserStats.byParty.find(p => p.partyName === partyNameForLike);
        if (currentUserPartyStat) {
            currentUserPartyStat.flSent++;
        } else {
            currentUserStats.byParty.push({ partyName: partyNameForLike, flReceived: 0, flSent: 1, fm: 0 });
        }
        if (likedUser.notificationSettings.facelikes) {
            console.log(`User ${likedUser.id} would receive a Facelike notification.`);
        }


    } else { 
        const likeToRemoveIndex = likedUser.pendingFacelikes.findIndex(
            pl => pl.userId === currentUser!.id && (pl.partyName === partyNameForLike || (pl.partyId === (partyIdForLike || '')))
        );

        if (likeToRemoveIndex > -1) {
            likedUser.pendingFacelikes.splice(likeToRemoveIndex, 1);
            likedUser.faceLikes = likedUser.pendingFacelikes.length;

            currentUserStats.facelikesSent = Math.max(0, currentUserStats.facelikesSent - 1);
            
            likedUserStats.facelikesReceived = Math.max(0, likedUserStats.facelikesReceived - 1);
            let likedUserPartyStat = likedUserStats.byParty.find(p => p.partyName === partyNameForLike);
            if (likedUserPartyStat) {
                likedUserPartyStat.flReceived = Math.max(0, likedUserPartyStat.flReceived - 1);
            }
            
            let currentUserPartyStat = currentUserStats.byParty.find(p => p.partyName === partyNameForLike);
            if (currentUserPartyStat) {
                currentUserPartyStat.flSent = Math.max(0, currentUserPartyStat.flSent - 1);
            }
        }
    }

    if (source === 'participants-list' && currentPartyContext) {
        renderPartyParticipants(currentPartyContext);
    } else if (source === 'participant-profile' || source === 'friend-profile') {
        if (currentViewedParticipantContext && currentViewedParticipantContext.id === userIdToLike) {
            renderParticipantProfileScreen(likedUser, navigationSourceForParticipantProfile);
        }
    } else if (source === 'ai-suggestions') {
        renderAiSuggestions();
    }
    renderHomeScreen(); 
    if (currentScreenId === 'statistics-screen') renderStatisticsScreen(); 
}

function sendFriendRequest(recipientId: string) {
    if (!currentUser || currentUser.id === recipientId) return;

    const recipient = allUsers.find(u => u.id === recipientId);
    if (!recipient) return;

    if (currentUser.friends.includes(recipientId) || 
        currentUser.friendRequestsSent.includes(recipientId) ||
        recipient.friendRequestsSent.includes(currentUser.id) ||
        currentUser.friendRequestsReceived.some(req => req.userId === recipientId)) {
        console.log("Friend request cannot be sent (already friends or request pending).");
        return;
    }

    currentUser.friendRequestsSent.push(recipientId);
    recipient.friendRequestsReceived.push({
        userId: currentUser.id,
        name: currentUser.name,
        profilePic: currentUser.profilePic,
        date: new Date().toISOString()
    });

    if (currentUser.statistics) {
        currentUser.statistics.friendRequestsSentCount = (currentUser.statistics.friendRequestsSentCount || 0) + 1;
    }
     if (recipient.statistics) {
        recipient.statistics.friendRequestsReceivedCount = (recipient.statistics.friendRequestsReceivedCount || 0) + 1;
    }

    alert(`Demande d'ami envoyée à ${recipient.name}.`);
    if (currentScreenId === 'participant-profile-screen' && currentViewedParticipantContext && currentViewedParticipantContext.id === recipientId) {
        renderParticipantProfileScreen(recipient, navigationSourceForParticipantProfile);
    } else if (currentScreenId === 'friends-screen') {
        renderFriendsScreen();
    }
    if (recipient.notificationSettings.messages) { 
        console.log(`User ${recipient.id} would receive a friend request notification from ${currentUser.name}.`);
    }
}

function removeFriend(friendId: string) {
    if (!currentUser) return;

    const friendIndexInCurrentUser = currentUser.friends.indexOf(friendId);
    if (friendIndexInCurrentUser > -1) {
        currentUser.friends.splice(friendIndexInCurrentUser, 1);
    }

    const friendUser = allUsers.find(u => u.id === friendId);
    if (friendUser) {
        const currentUserIndexInFriend = friendUser.friends.indexOf(currentUser.id);
        if (currentUserIndexInFriend > -1) {
            friendUser.friends.splice(currentUserIndexInFriend, 1);
        }
    }
    
    alert(`Vous n'êtes plus ami avec ${friendUser ? friendUser.name : 'cet utilisateur'}.`);

    if (currentScreenId === 'participant-profile-screen' && currentViewedParticipantContext && currentViewedParticipantContext.id === friendId) {
        renderParticipantProfileScreen(currentViewedParticipantContext, navigationSourceForParticipantProfile);
    } else if (currentScreenId === 'friends-screen') {
        renderFriendsScreen();
    }
     if (currentScreenId === 'profile-screen') { 
        renderProfileScreen();
    }
}


function renderParticipantProfileScreen(participant: User, source?: string) {
    if (!currentUser) { navigateTo('login-screen'); return; }
    currentViewedParticipantContext = participant; 
    navigationSourceForParticipantProfile = source;

    document.getElementById('participant-profile-name-header')!.textContent = participant.name;
    (document.getElementById('participant-profile-main-pic') as HTMLImageElement).src = participant.profilePictureUrl || participant.profilePic;
    document.getElementById('participant-profile-name-age')!.textContent = `${participant.name}, ${participant.age} ans`;
    document.getElementById('participant-profile-drink')!.innerHTML = `<i class="fas fa-cocktail"></i> ${participant.favoriteDrink || 'N/A'}`;
    document.getElementById('participant-profile-bio')!.textContent = `"${participant.bio}"`;

    let genderText = participant.gender.charAt(0).toUpperCase() + participant.gender.slice(1);
    if (participant.gender === 'other' && participant.detailedGender) {
        genderText += ` (${participant.detailedGender})`;
    }
    document.getElementById('participant-profile-gender')!.textContent = genderText;
    document.getElementById('participant-profile-height')!.textContent = participant.height || 'N/A';
    document.getElementById('participant-profile-country')!.textContent = participant.country || 'N/A';
    document.getElementById('participant-profile-eye-color')!.textContent = participant.eyeColor || 'N/A';
    document.getElementById('participant-profile-hair-color')!.textContent = participant.hairColor || 'N/A';


    const facelikeButtonHeader = document.getElementById('participant-profile-facelike-button-header')!;
    const facelikeButtonMain = document.getElementById('participant-profile-facelike-button-main')!;
    
    // Header Facelike Button
    facelikeButtonHeader.innerHTML = `<i class="${participant.isFaceliked ? 'fas' : 'far'} fa-heart"></i> ${participant.isFaceliked ? 'Faceliked' : 'Facelike'}`;
    facelikeButtonHeader.classList.toggle('liked', !!participant.isFaceliked);
    const newFacelikeButtonHeader = facelikeButtonHeader.cloneNode(true) as HTMLElement;
    facelikeButtonHeader.parentNode?.replaceChild(newFacelikeButtonHeader, facelikeButtonHeader);
    newFacelikeButtonHeader.addEventListener('click', () => toggleFacelike(participant.id, 'participant-profile'));

    // Main Facelike Button (keeps original behavior, e.g. background change if it was doing that)
    facelikeButtonMain.innerHTML = `<i class="${participant.isFaceliked ? 'fas' : 'far'} fa-heart"></i> ${participant.isFaceliked ? 'Faceliked' : 'Facelike'}`;
    facelikeButtonMain.classList.toggle('liked', !!participant.isFaceliked);
    const newFacelikeButtonMain = facelikeButtonMain.cloneNode(true) as HTMLElement;
    facelikeButtonMain.parentNode?.replaceChild(newFacelikeButtonMain, facelikeButtonMain);
    newFacelikeButtonMain.addEventListener('click', () => toggleFacelike(participant.id, 'participant-profile'));


    const addFriendButton = document.getElementById('participant-profile-add-friend-button') as HTMLButtonElement;
    const removeFriendButton = document.getElementById('participant-profile-remove-friend-button') as HTMLButtonElement;

    const isFriend = currentUser!.friends.includes(participant.id);
    const hasSentRequest = currentUser!.friendRequestsSent.includes(participant.id);
    const hasReceivedRequest = currentUser!.friendRequestsReceived.some(req => req.userId === participant.id);

    if (isFriend) {
        addFriendButton.style.display = 'none';
        removeFriendButton.style.display = 'block';
        const newRemoveFriendButton = removeFriendButton.cloneNode(true) as HTMLButtonElement;
        removeFriendButton.parentNode!.replaceChild(newRemoveFriendButton, removeFriendButton);
        newRemoveFriendButton.onclick = () => {
            if (confirm(`Voulez-vous vraiment retirer ${participant.name} de vos amis ?`)) {
                removeFriend(participant.id);
            }
        };
    } else if (hasSentRequest) {
        addFriendButton.style.display = 'block';
        addFriendButton.textContent = 'Demande envoyée';
        addFriendButton.disabled = true;
        removeFriendButton.style.display = 'none';
    } else if (hasReceivedRequest) {
        addFriendButton.style.display = 'block';
        addFriendButton.textContent = 'Répondre à la demande';
        addFriendButton.disabled = false;
        const newAddFriendButton = addFriendButton.cloneNode(true) as HTMLButtonElement;
        addFriendButton.parentNode!.replaceChild(newAddFriendButton, addFriendButton);
        newAddFriendButton.onclick = () => navigateTo('friends-screen'); // User will accept/reject from friends screen
        removeFriendButton.style.display = 'none';
    } else {
        addFriendButton.style.display = 'block';
        addFriendButton.textContent = 'Ajouter comme ami';
        addFriendButton.disabled = false;
        const newAddFriendButton = addFriendButton.cloneNode(true) as HTMLButtonElement;
        addFriendButton.parentNode!.replaceChild(newAddFriendButton, addFriendButton);
        newAddFriendButton.onclick = () => sendFriendRequest(participant.id);
        removeFriendButton.style.display = 'none';
    }
    const goingOutStatusEl = document.getElementById('participant-profile-going-out-status')!;
    if (isFriend && participant.isGoingOut && participant.goingOutToPartyName && participant.privacySettings.shareGoingOutStatus) {
        goingOutStatusEl.innerHTML = `<i class="fas fa-glass-cheers"></i> En soirée à: <span class="link-lookalike" data-party-id="${participant.goingOutToPartyId}" role="link" tabindex="0">${participant.goingOutToPartyName}</span>`;
        goingOutStatusEl.style.display = 'block';
        const partyLink = goingOutStatusEl.querySelector('.link-lookalike');
        partyLink?.addEventListener('click', (e) => {
            const partyId = (e.target as HTMLElement).dataset.partyId;
            const party = [...partiesAround, ...pastParties].find(p => p.id === partyId);
            if (party) navigateTo('party-details-screen', { party, joiningFriendName: participant.name });
        });
         partyLink?.addEventListener('keydown', (e) => {
            if((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') {
                 const partyId = (e.target as HTMLElement).dataset.partyId;
                const party = [...partiesAround, ...pastParties].find(p => p.id === partyId);
                if (party) navigateTo('party-details-screen', { party, joiningFriendName: participant.name });
            }
        });
    } else {
        goingOutStatusEl.style.display = 'none';
    }
}


function renderFacelikesScreen() {
    if (!currentUser) { navigateTo('login-screen'); return; }
    const listContainer = document.getElementById('facelikes-list')!;
    const todaysPendingLikes = currentUser.pendingFacelikes.filter(fl => isToday(fl.dateReceived));

    if (todaysPendingLikes.length === 0) {
        listContainer.innerHTML = "<p class='empty-list-message'>Aucun facelike reçu aujourd'hui.</p>";
        return;
    }

    const likesByParty: { [key: string]: PendingFacelike[] } = todaysPendingLikes.reduce((acc, like) => {
        (acc[like.partyName] = acc[like.partyName] || []).push(like);
        return acc;
    }, {} as { [key: string]: PendingFacelike[] });

    listContainer.innerHTML = Object.entries(likesByParty).map(([partyName, likes]) => `
        <div class="party-group">
            <h3 class="party-group-header">${partyName} (${likes.length})</h3>
            <div class="item-list-by-party">
                ${likes.map(fl => `
                    <div class="facelike-item" data-like-id="${fl.id}">
                        <img src="${fl.profilePic}" alt="${fl.name}">
                        <div class="facelike-info">
                            <h3>${fl.name}</h3>
                            ${fl.message ? `<p>${fl.message}</p>` : ''}
                        </div>
                        <button class="accept-facelike-button" data-like-id="${fl.id}" data-user-id="${fl.userId}" aria-label="Accept Facelike from ${fl.name}">Accepter</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.accept-facelike-button').forEach(button => {
        button.addEventListener('click', (e) => {
            if (!currentUser) return; 
            const likeId = (e.currentTarget as HTMLElement).dataset.likeId;
            const likedByUserId = (e.currentTarget as HTMLElement).dataset.userId;

            const pendingLikeIndex = currentUser.pendingFacelikes.findIndex(fl => fl.id === likeId);
            if (pendingLikeIndex === -1 || !likedByUserId) return;

            const acceptedLike = currentUser.pendingFacelikes[pendingLikeIndex];
            
            const newMatch: ConfirmedFacematch = {
                matchId: `cfm-${Date.now()}`,
                userId: likedByUserId,
                name: acceptedLike.name,
                profilePic: acceptedLike.profilePic,
                partyId: acceptedLike.partyId,
                partyName: acceptedLike.partyName,
                dateMatched: new Date().toISOString(),
                conversationId: `chat-${currentUser.id}-${likedByUserId}-${Date.now()}` // More unique conversation ID
            };
            currentUser.confirmedFacematches.push(newMatch);

            currentUser.pendingFacelikes.splice(pendingLikeIndex, 1);
            
            const currentUserStats = ensureStatistics(currentUser);
            currentUserStats.facematches++;
            let partyStat = currentUserStats.byParty.find(p => p.partyName === acceptedLike.partyName);
            if (partyStat) {
                partyStat.fm++;
            } else {
                currentUserStats.byParty.push({ partyName: acceptedLike.partyName, flReceived: 0, flSent: 0, fm: 1 });
            }
            
            currentUser.faceLikes = currentUser.pendingFacelikes.length;
            currentUser.faceMatches = currentUser.confirmedFacematches.filter(fm => isToday(fm.dateMatched)).length;

            const conversation: Conversation = {
                id: newMatch.conversationId,
                userId: likedByUserId,
                name: acceptedLike.name,
                profilePic: acceptedLike.profilePic,
                lastMessage: "Vous avez un nouveau Facematch!",
                time: "Maintenant",
                unread: 1 
            };
            if(!mockConversations.find(c => c.id === newMatch.conversationId)) { // Check by specific ID
                mockConversations.unshift(conversation); 
            }
            
            if (currentUser.notificationSettings.facematches) {
                 console.log(`User ${currentUser.id} would receive a Facematch notification for match with ${acceptedLike.name}.`);
            }


            renderHomeScreen(); 
            renderFacelikesScreen(); 
            if(currentScreenId === 'statistics-screen') renderStatisticsScreen();
            renderMessagingScreen(); 
            navigateTo('chat-view-screen', { conversation });
        });
    });
}

function renderFacematchesTodayScreen() {
     if (!currentUser) { navigateTo('login-screen'); return; }
    const listContainer = document.getElementById('facematches-today-list')!;
    const todaysMatches = currentUser.confirmedFacematches.filter(fm => isToday(fm.dateMatched));

    if (todaysMatches.length === 0) {
        listContainer.innerHTML = "<p class='empty-list-message'>Aucun facematch aujourd'hui.</p>";
        return;
    }

    const matchesByParty: { [key: string]: ConfirmedFacematch[] } = todaysMatches.reduce((acc, match) => {
        (acc[match.partyName] = acc[match.partyName] || []).push(match);
        return acc;
    }, {} as { [key: string]: ConfirmedFacematch[] });

    listContainer.innerHTML = Object.entries(matchesByParty).map(([partyName, matches]) => `
        <div class="party-group">
            <h3 class="party-group-header">${partyName} (${matches.length})</h3>
            <div class="item-list-by-party">
                ${matches.map(fm => `
                    <div class="facematch-item" data-match-id="${fm.matchId}">
                        <img src="${fm.profilePic}" alt="${fm.name}">
                        <div class="facematch-info">
                            <h3>Match avec ${fm.name}</h3>
                            <p>Le ${new Date(fm.dateMatched).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <button class="view-chat-button" data-conversation-id="${fm.conversationId}" data-user-id="${fm.userId}" aria-label="Message ${fm.name}">Message</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.view-chat-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const conversationId = (e.currentTarget as HTMLElement).dataset.conversationId;
            const userId = (e.currentTarget as HTMLElement).dataset.userId;
            let conversation = mockConversations.find(c => c.id === conversationId);
            
            if (!conversation && userId) { 
                 const matchedUser = allUsers.find(u => u.id === userId);
                 if (matchedUser) {
                    conversation = {
                        id: conversationId || `chat-${currentUser!.id}-${userId}-${Date.now()}`,
                        userId: userId,
                        name: matchedUser.name,
                        profilePic: matchedUser.profilePic,
                        lastMessage: "Vous avez matché!",
                        time: "Maintenant",
                        unread: 0
                    };
                    if(!mockConversations.find(c => c.id === conversation!.id)) {
                       mockConversations.unshift(conversation);
                    }
                 }
            }

            if (conversation) {
                if (conversation.unread > 0) conversation.unread = 0;
                renderMessagingScreen();
                navigateTo('chat-view-screen', { conversation });
            }
        });
    });
}


function renderMessagingScreen() {
    const listContainer = document.getElementById('conversations-list')!;
    const sortedConversations = [...mockConversations].sort((a,b) => {
        if (a.unread > 0 && b.unread === 0) return -1;
        if (b.unread > 0 && a.unread === 0) return 1;
        
        const timeA = new Date(`1970/01/01 ${a.time === "Maintenant" || a.time === "Hier" ? "00:00" : a.time}`).getTime();
        const timeB = new Date(`1970/01/01 ${b.time === "Maintenant" || b.time === "Hier" ? "00:00" : b.time}`).getTime();
        
        if (a.time === "Maintenant") return -1;
        if (b.time === "Maintenant") return 1;
        if (a.time === "Hier" && b.time !== "Maintenant") return -1;
        if (b.time === "Hier" && a.time !== "Maintenant") return 1;

        return timeB - timeA;
    });


    listContainer.innerHTML = sortedConversations.map(conv => `
        <div class="conversation-item" data-conversation-id="${conv.id}" data-user-id="${conv.userId}" role="button" tabindex="0" aria-label="Open chat with ${conv.name}">
            <img src="${conv.profilePic}" alt="${conv.name}">
            <div class="conversation-details">
                <h3>${conv.name}</h3>
                <p class="last-message">${conv.partyShare ? `<i class="fas fa-glass-cheers"></i> Soirée partagée: ${conv.partyShare.partyName}` : conv.lastMessage}</p>
            </div>
            <div class="conversation-info">
                <span class="time">${conv.time}</span>
                ${conv.unread ? `<span class="unread-badge">${conv.unread}</span>` : ''}
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.conversation-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const userId = (e.currentTarget as HTMLElement).dataset.userId;
            const conversation = mockConversations.find(c => c.userId === userId);
            if (conversation) {
                if (conversation.unread > 0) {
                    conversation.unread = 0; 
                    renderMessagingScreen(); 
                }
                navigateTo('chat-view-screen', { conversation });
            }
        });
         item.addEventListener('keydown', (e) => {
            if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') {
                const userId = (e.currentTarget as HTMLElement).dataset.userId;
                const conversation = mockConversations.find(c => c.userId === userId);
                if (conversation) {
                    if (conversation.unread > 0) {
                        conversation.unread = 0; 
                        renderMessagingScreen(); 
                    }
                    navigateTo('chat-view-screen', { conversation });
                }
            }
        });
    });
}

function renderNewChatFriendsScreen() {
    if (!currentUser) { navigateTo('login-screen'); return; }
    const listContainer = document.getElementById('new-chat-friends-list')!;
    if (!listContainer) return;

    const friends = currentUser.friends.map(friendId => allUsers.find(u => u.id === friendId)).filter(Boolean) as User[];

    if (friends.length === 0) {
        listContainer.innerHTML = "<p class='empty-list-message'>Vous n'avez pas encore d'amis à qui écrire.</p>";
        return;
    }

    listContainer.innerHTML = friends.map(friend => `
        <div class="friend-item friend-attending-item" data-user-id="${friend.id}" role="button" tabindex="0" aria-label="Start chat with ${friend.name}">
            <img src="${friend.profilePic}" alt="${friend.name}" class="friend-attending-pic">
            <span class="friend-attending-name">${friend.name}</span>
            <i class="fas fa-chevron-right friend-attending-chevron"></i>
        </div>
    `).join('');

    listContainer.querySelectorAll('.friend-item').forEach(item => {
        item.addEventListener('click', () => {
            const friendId = (item as HTMLElement).dataset.userId;
            if (!friendId) return;

            const friendUser = allUsers.find(u => u.id === friendId);
            if (!friendUser) return;

            let conversation = mockConversations.find(c => c.userId === friendId && c.id.startsWith(`chat-${currentUser!.id}-${friendId}`) || c.id.startsWith(`chat-${friendId}-${currentUser!.id}`));
            if (!conversation) {
                conversation = {
                    id: `chat-${currentUser!.id}-${friendId}-${Date.now()}`,
                    userId: friendId,
                    name: friendUser.name,
                    profilePic: friendUser.profilePic,
                    lastMessage: "Commencez la conversation!",
                    time: "Maintenant",
                    unread: 0
                };
                mockConversations.unshift(conversation);
                renderMessagingScreen(); 
            }
             if (conversation.unread > 0) {
                conversation.unread = 0;
                renderMessagingScreen();
            }
            navigateTo('chat-view-screen', { conversation });
        });
    });
}


// --- START OF NEW/PLACEHOLDER FUNCTIONS ---

function renderChatView(conversation: Conversation) {
    if (!currentUser) { navigateTo('login-screen'); return; }
    document.getElementById('chat-with-name')!.textContent = conversation.name; // Updated ID
    (document.getElementById('chat-avatar') as HTMLImageElement)!.src = conversation.profilePic; // Updated ID


    const messagesContainer = document.getElementById('chat-messages')!; // Updated ID
    messagesContainer.innerHTML = `
        <div class="chat-message received">
            <p>${conversation.lastMessage}</p>
            <span class="message-time">${conversation.time}</span>
        </div>
        ${conversation.partyShare ? `
            <div class="chat-message sent system-message" data-party-id="${conversation.partyShare.partyId}">
                <p><i class="fas fa-glass-cheers"></i> Soirée partagée: <strong>${conversation.partyShare.partyName}</strong></p>
                <span class="message-time">Maintenant</span>
            </div>
        ` : ''}
    `;
     // Add event listener for shared party message click
    messagesContainer.querySelectorAll('.system-message').forEach(el => { // Updated selector
        el.addEventListener('click', (e) => {
            const partyId = (e.currentTarget as HTMLElement).dataset.partyId;
            const party = [...partiesAround, ...pastParties].find(p => p.id === partyId);
            if (party) {
                navigateTo('party-details-screen', { party });
            }
        });
    });

    const messageInput = document.getElementById('chat-message-input') as HTMLInputElement;
    const sendMessageButton = document.getElementById('send-chat-message')!; // Updated ID
    
    const newSendMessageButton = sendMessageButton.cloneNode(true) as HTMLButtonElement;
    sendMessageButton.parentNode!.replaceChild(newSendMessageButton, sendMessageButton);

    newSendMessageButton.onclick = () => {
        const messageText = messageInput.value.trim();
        if (messageText && currentUser) {
            messagesContainer.innerHTML += `
                <div class="chat-message sent">
                    <p>${messageText}</p>
                    <span class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>`;
            messageInput.value = '';
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            // Update conversation in mock data
            const convIndex = mockConversations.findIndex(c => c.id === conversation.id);
            if (convIndex > -1) {
                mockConversations[convIndex].lastMessage = messageText;
                mockConversations[convIndex].time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                // If current user sends message, other user's unread count increases (simulation)
                // In a real app, this would be handled server-side.
                const recipientUser = allUsers.find(u => u.id === conversation.userId);
                if (recipientUser && recipientUser.id !== currentUser.id) {
                     // In a real app, we'd update the recipient's view. Here we just log.
                    console.log(`Message sent to ${recipientUser.name}. They would get an unread count update.`);
                }
            }
             if (currentScreenId === 'messaging-screen') { // Re-render if on messaging screen to show updated last message
                renderMessagingScreen();
            }
        }
    };
}

function renderLineupDetailsScreen(party: Party) {
    document.getElementById('lineup-details-party-name')!.textContent = `Lineup - ${party.name}`;
    const scheduleContainer = document.getElementById('lineup-schedule-list')!;
    const historyContainer = document.getElementById('lineup-history-list')!;
    const scheduleTitleEl = document.getElementById('lineup-details-schedule-title');
    if (scheduleTitleEl) {
        scheduleTitleEl.textContent = `Programme de ce soir à ${party.name.toUpperCase()}`;
    }


    if (party.musicLineup.schedule.length > 0) {
        scheduleContainer.innerHTML = party.musicLineup.schedule.map(track => `
            <li class="lineup-item-styled">
                ${track.time}: ${track.artist} - ${track.track}
            </li>
        `).join('');
    } else {
        scheduleContainer.innerHTML = "<p class='empty-list-message'>Aucun lineup prévu pour le moment.</p>";
    }

    if (party.musicLineup.history.length > 0) {
        historyContainer.innerHTML = party.musicLineup.history.map(track => `
            <li class="lineup-item-styled">
                ${track.date}: ${track.artist} - ${track.track}
            </li>
        `).join('');
    } else {
        historyContainer.innerHTML = "<p class='empty-list-message'>Aucun historique de lineup disponible.</p>";
    }
}

function renderFpVisitorsHistoryScreen(party: Party) {
    document.getElementById('fp-visitors-history-party-name')!.textContent = `Historique Visiteurs FP - ${party.name}`;
    const listContainer = document.getElementById('fp-visitors-history-list')!;
    
    if (party.pastEventsFacePartyAttendance.length > 0) {
        listContainer.innerHTML = party.pastEventsFacePartyAttendance.map(event => `
            <li class="fp-visitor-event-item-card">
                <span class="fp-event-name-date">${event.eventName} (${event.date})</span>
                <span class="fp-event-attendees-count">${event.fpAttendees} participants FaceParty</span>
            </li>
        `).join('');
    } else {
        listContainer.innerHTML = "<li class='empty-list-message'>Aucun historique de visiteurs FP pour cette soirée.</li>";
    }
}

function renderSendPartyToFriendsScreen(party: Party) {
    if (!currentUser) { navigateTo('login-screen'); return; }
    document.getElementById('send-party-friends-title')!.textContent = `Envoyer ${party.name} à des amis`; // Updated ID
    const friendsListContainer = document.getElementById('send-party-friends-list-container')!;
    
    const friends = currentUser.friends.map(id => allUsers.find(u => u.id === id)).filter(Boolean) as User[];
    
    const sendButton = document.getElementById('send-party-to-friends-action-button') as HTMLButtonElement; // Updated ID

    if (friends.length === 0) {
        friendsListContainer.innerHTML = "<p class='empty-list-message'>Vous n'avez aucun ami à qui envoyer cette soirée.</p>";
        if(sendButton) sendButton.style.display = 'none';
        return;
    }
    
    if(sendButton) sendButton.style.display = 'block'; // Make sure it's visible
    selectedFriendsForPartyShare = []; // Reset selections for this screen specifically

    friendsListContainer.innerHTML = friends.map(friend => `
        <div class="share-friend-item">
            <input type="checkbox" id="send-party-friend-${friend.id}" value="${friend.id}" name="sendPartyFriend" aria-labelledby="send-party-friend-label-${friend.id}">
            <label for="send-party-friend-${friend.id}" id="send-party-friend-label-${friend.id}" class="friend-selection-label">
                <img src="${friend.profilePic}" alt="${friend.name}">
                <span>${friend.name}</span>
            </label>
        </div>
    `).join('');

    friendsListContainer.querySelectorAll('input[name="sendPartyFriend"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const friendId = (e.target as HTMLInputElement).value;
            if ((e.target as HTMLInputElement).checked) {
                if (!selectedFriendsForPartyShare.includes(friendId)) {
                    selectedFriendsForPartyShare.push(friendId);
                }
            } else {
                selectedFriendsForPartyShare = selectedFriendsForPartyShare.filter(id => id !== friendId);
            }
        });
    });

    const confirmButton = document.getElementById('send-party-to-friends-action-button')!; // Re-get the button
    const newConfirmButton = confirmButton.cloneNode(true) as HTMLButtonElement;
    confirmButton.parentNode!.replaceChild(newConfirmButton, confirmButton);
    newConfirmButton.addEventListener('click', () => {
        if (!currentUser || !currentPartyContext) return;
        const feedbackMessageEl = document.getElementById('send-party-feedback-message');

        if (selectedFriendsForPartyShare.length === 0) {
            if (feedbackMessageEl) {
                feedbackMessageEl.textContent = "Veuillez sélectionner au moins un ami.";
                feedbackMessageEl.style.color = 'var(--danger-color)';
            } else {
                alert("Veuillez sélectionner au moins un ami.");
            }
            return;
        }
        
        selectedFriendsForPartyShare.forEach(friendId => {
            const friend = allUsers.find(u => u.id === friendId);
            if (friend) {
                let conversation = mockConversations.find(c => c.userId === friendId && (c.id.startsWith(`chat-${currentUser!.id}-${friendId}`) || c.id.startsWith(`chat-${friendId}-${currentUser!.id}`)));
                if (!conversation) {
                    conversation = {
                        id: `chat-${currentUser!.id}-${friendId}-${Date.now()}`,
                        userId: friendId,
                        name: friend.name,
                        lastMessage: `Invitation à la soirée: ${currentPartyContext.name}`,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        unread: 1,
                        profilePic: friend.profilePic,
                        partyShare: { partyId: currentPartyContext.id, partyName: currentPartyContext.name }
                    };
                    mockConversations.unshift(conversation);
                } else {
                    conversation.lastMessage = `Invitation à la soirée: ${currentPartyContext.name}`;
                    conversation.time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    conversation.unread = (conversation.unread || 0) + 1;
                    conversation.partyShare = { partyId: currentPartyContext.id, partyName: currentPartyContext.name };
                     mockConversations = [conversation, ...mockConversations.filter(c => c.id !== conversation!.id)];
                }
                 if (friend.notificationSettings.messages) {
                    console.log(`Simulated notification to ${friend.name} about shared party: ${currentPartyContext.name}`);
                }
            }
        });
        
        if (feedbackMessageEl) {
            feedbackMessageEl.textContent = `Soirée ${currentPartyContext.name} envoyée à ${selectedFriendsForPartyShare.length} ami(s) !`;
            feedbackMessageEl.style.color = 'var(--success-color)';
        } else {
            alert(`Soirée ${currentPartyContext.name} envoyée à ${selectedFriendsForPartyShare.length} ami(s) !`);
        }
        
        selectedFriendsForPartyShare = []; // Reset after sending
        renderMessagingScreen();
        
        setTimeout(() => {
            if (feedbackMessageEl) feedbackMessageEl.textContent = '';
            navigateTo('messaging-screen'); // Navigate to messages to see the sent items
        }, 1500);
    });
}

function renderSettingsScreen() {
    if (!currentUser) return;
    
    document.getElementById('nav-notifications-settings')?.addEventListener('click', () => navigateTo('notifications-setting-screen'));
    document.getElementById('nav-privacy-settings')?.addEventListener('click', () => navigateTo('privacy-setting-screen'));
    document.getElementById('nav-account-settings')?.addEventListener('click', () => navigateTo('account-setting-screen'));
    document.getElementById('nav-help-settings')?.addEventListener('click', () => navigateTo('help-setting-screen'));
    
    const logoutButton = document.getElementById('nav-logout-settings')!;
    const newLogoutButton = logoutButton.cloneNode(true) as HTMLButtonElement;
    logoutButton.parentNode!.replaceChild(newLogoutButton, logoutButton);
    newLogoutButton.addEventListener('click', () => {
        showModal('logout-confirm-modal');
    });

    const logoutConfirmYes = document.getElementById('logout-confirm-yes-button')!;
    const newLogoutConfirmYes = logoutConfirmYes.cloneNode(true) as HTMLButtonElement;
    logoutConfirmYes.parentNode!.replaceChild(newLogoutConfirmYes, logoutConfirmYes);
    newLogoutConfirmYes.addEventListener('click', () => {
        closeModal('logout-confirm-modal');
        isUserLoggedIn = false;
        currentUser = null;
        currentUserId = null;
        sessionStorage.removeItem('isFacePartyLoggedIn');
        sessionStorage.removeItem('facePartyCurrentUserId');
        screenHistory = ['login-screen']; 
        navigateTo('login-screen');
    });

    document.getElementById('logout-confirm-no-button')?.addEventListener('click', () => closeModal('logout-confirm-modal'));
    document.getElementById('actual-close-logout-confirm-modal-button')?.addEventListener('click', () => closeModal('logout-confirm-modal'));
}

function renderFriendsScreen() {
    if (!currentUser) { navigateTo('login-screen'); return; }

    const requestsContainer = document.getElementById('received-friend-requests-list')!;
    const friendsContainer = document.getElementById('my-friends-list')!;
    const sentRequestsContainer = document.getElementById('sent-friend-requests-list')!;
    
    document.getElementById('received-requests-count')!.textContent = currentUser.friendRequestsReceived.length.toString();
    document.getElementById('my-friends-count')!.textContent = currentUser.friends.length.toString();
    document.getElementById('sent-requests-count')!.textContent = currentUser.friendRequestsSent.length.toString();


    // Friend Requests Received
    if (currentUser.friendRequestsReceived.length > 0) {
        requestsContainer.innerHTML = currentUser.friendRequestsReceived.map(req => `
            <div class="friend-request-item">
                <img src="${req.profilePic}" alt="${req.name}">
                <div class="friend-info">
                     <h5>${req.name}</h5>
                     <p>Reçu: ${new Date(req.date).toLocaleDateString()}</p>
                </div>
                <div class="friend-request-actions">
                    <button class="button-accept-friend" data-user-id="${req.userId}" aria-label="Accept friend request from ${req.name}"><i class="fas fa-check"></i></button>
                    <button class="button-reject-friend decline" data-user-id="${req.userId}" aria-label="Reject friend request from ${req.name}"><i class="fas fa-times"></i></button>
                </div>
            </div>
        `).join('');
    } else {
        requestsContainer.innerHTML = "<p class='empty-list-message'>Aucune demande reçue.</p>";
    }

    // Current Friends
    const friends = currentUser.friends.map(id => allUsers.find(u => u.id === id)).filter(Boolean) as User[];
    if (friends.length > 0) {
        friendsContainer.innerHTML = friends.map(friend => `
            <div class="friend-item" data-user-id="${friend.id}" role="button" tabindex="0" aria-label="View profile of ${friend.name}">
                <img src="${friend.profilePic}" alt="${friend.name}">
                <div class="friend-info"><h5>${friend.name}</h5></div>
                <i class="fas fa-chevron-right"></i>
            </div>
        `).join('');
    } else {
        friendsContainer.innerHTML = "<p class='empty-list-message'>Vous n'avez pas encore d'amis.</p>";
    }
    
    // Friend Requests Sent
    if (currentUser.friendRequestsSent.length > 0) {
        sentRequestsContainer.innerHTML = currentUser.friendRequestsSent.map(userId => {
            const user = allUsers.find(u => u.id === userId);
            return user ? `
                <div class="friend-request-item">
                    <img src="${user.profilePic}" alt="${user.name}">
                     <div class="friend-info"><h5>${user.name}</h5> <p>Envoyée</p></div>
                    <button class="button-cancel-request" data-user-id="${userId}" aria-label="Cancel friend request to ${user.name}">Annuler</button>
                </div>
            ` : '';
        }).join('');
    } else {
        sentRequestsContainer.innerHTML = "<p class='empty-list-message'>Aucune demande envoyée.</p>";
    }


    // Event Listeners
    requestsContainer.querySelectorAll('.button-accept-friend').forEach(btn => btn.addEventListener('click', (e) => {
        const userId = (e.currentTarget as HTMLElement).dataset.userId;
        if (userId && currentUser) {
            currentUser.friends.push(userId);
            const friendUser = allUsers.find(u => u.id === userId);
            if (friendUser) friendUser.friends.push(currentUser.id);
            currentUser.friendRequestsReceived = currentUser.friendRequestsReceived.filter(req => req.userId !== userId);
             if (currentUser.statistics) { 
                currentUser.statistics.friendRequestsReceivedCount = Math.max(0, (currentUser.statistics.friendRequestsReceivedCount || 0) -1);
            }
            renderFriendsScreen();
        }
    }));
    requestsContainer.querySelectorAll('.button-reject-friend').forEach(btn => btn.addEventListener('click', (e) => {
        const userId = (e.currentTarget as HTMLElement).dataset.userId;
        if (userId && currentUser) {
            currentUser.friendRequestsReceived = currentUser.friendRequestsReceived.filter(req => req.userId !== userId);
             if (currentUser.statistics) { 
                currentUser.statistics.friendRequestsReceivedCount = Math.max(0, (currentUser.statistics.friendRequestsReceivedCount || 0) -1);
            }
            renderFriendsScreen();
        }
    }));
    friendsContainer.querySelectorAll('.friend-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const userId = (e.currentTarget as HTMLElement).dataset.userId;
            const user = allUsers.find(u => u.id === userId);
            if (user) navigateTo('participant-profile-screen', { participant: user, source: 'friends-list' });
        });
        item.addEventListener('keydown', (e) => {
             if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') {
                const userId = (e.currentTarget as HTMLElement).dataset.userId;
                const user = allUsers.find(u => u.id === userId);
                if (user) navigateTo('participant-profile-screen', { participant: user, source: 'friends-list' });
            }
        });
    });
    
    sentRequestsContainer.querySelectorAll('.button-cancel-request').forEach(btn => btn.addEventListener('click', (e) => {
        const userId = (e.currentTarget as HTMLElement).dataset.userId;
        if (userId && currentUser) {
            currentUser.friendRequestsSent = currentUser.friendRequestsSent.filter(id => id !== userId);
            const recipient = allUsers.find(u => u.id === userId);
            if (recipient) {
                recipient.friendRequestsReceived = recipient.friendRequestsReceived.filter(req => req.userId !== currentUser!.id);
            }
            if (currentUser.statistics) {
                 currentUser.statistics.friendRequestsSentCount = Math.max(0, (currentUser.statistics.friendRequestsSentCount || 0) -1);
            }
            renderFriendsScreen();
        }
    }));
}

function renderStatisticsScreen() {
    if (!currentUser || !currentUser.statistics) {
        document.getElementById('statistics-screen')!.innerHTML = "<p>Statistiques non disponibles.</p>"; // Target screen itself
        return;
    }
    const stats = ensureStatistics(currentUser); // Ensure stats object and byParty array exist
    
    (document.getElementById('stats-fl-sent') as HTMLElement).textContent = stats.facelikesSent.toString();
    (document.getElementById('stats-fl-received-total') as HTMLElement).textContent = stats.facelikesReceived.toString();
    (document.getElementById('stats-fl-received-pending') as HTMLElement).textContent = currentUser.pendingFacelikes.length.toString();
    (document.getElementById('stats-fm-total') as HTMLElement).textContent = stats.facematches.toString();
    
    (document.getElementById('stats-friend-req-sent') as HTMLElement).textContent = (stats.friendRequestsSentCount || 0).toString();
    (document.getElementById('stats-friend-req-received') as HTMLElement).textContent = (stats.friendRequestsReceivedCount || 0).toString();
    (document.getElementById('stats-friend-acceptance-rate') as HTMLElement).textContent = stats.friendAcceptanceRate || "N/A";

    const byPartyList = document.getElementById('stats-party-list') as HTMLElement;
    if (stats.byParty && stats.byParty.length > 0) {
        byPartyList.innerHTML = stats.byParty.map(pStat => `
            <li>
                <strong>${pStat.partyName}:</strong> 
                Reçus: ${pStat.flReceived}, Envoyés: ${pStat.flSent}, Matchs: ${pStat.fm}
            </li>
        `).join('');
    } else {
        byPartyList.innerHTML = "<p>Aucune statistique par soirée pour le moment.</p>";
    }
     // Placeholder for charts - in a real app, you'd use a charting library
    (document.getElementById('stats-activity-chart-placeholder') as HTMLElement).textContent = "Graphique d'activité des Facelikes (simulation)";
    (document.getElementById('stats-party-breakdown-chart-placeholder') as HTMLElement).textContent = "Graphique des Facematchs par soirée (simulation)";
}

function renderNotificationsSettingScreen() {
    if (!currentUser) return;
    const contentEl = document.getElementById('notifications-settings-content')!;
    contentEl.innerHTML = `
        <div class="setting-section">
            <div class="setting-option">
                <label for="notif-messages-toggle">Messages Privés</label>
                <label class="toggle-switch">
                    <input type="checkbox" id="notif-messages-toggle" ${currentUser.notificationSettings.messages ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
            <div class="setting-option">
                <label for="notif-facelikes-toggle">Nouveaux Facelikes</label>
                <label class="toggle-switch">
                    <input type="checkbox" id="notif-facelikes-toggle" ${currentUser.notificationSettings.facelikes ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
            <div class="setting-option">
                <label for="notif-facematches-toggle">Nouveaux Facematchs</label>
                <label class="toggle-switch">
                    <input type="checkbox" id="notif-facematches-toggle" ${currentUser.notificationSettings.facematches ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
        </div>`;
    
    document.getElementById('notif-messages-toggle')!.onchange = (e) => { currentUser!.notificationSettings.messages = (e.target as HTMLInputElement).checked; };
    document.getElementById('notif-facelikes-toggle')!.onchange = (e) => { currentUser!.notificationSettings.facelikes = (e.target as HTMLInputElement).checked; };
    document.getElementById('notif-facematches-toggle')!.onchange = (e) => { currentUser!.notificationSettings.facematches = (e.target as HTMLInputElement).checked; };
}

function renderPrivacySettingScreen() {
     if (!currentUser) return;
     const contentEl = document.getElementById('privacy-settings-content')!;
     contentEl.innerHTML = `
        <div class="setting-section">
            <div class="setting-option">
                <label for="privacy-hide-profile-toggle">Cacher mon profil dans la recherche (sauf si à la même soirée)</label>
                <label class="toggle-switch">
                    <input type="checkbox" id="privacy-hide-profile-toggle" ${currentUser.privacySettings.hideProfileInPartySearch ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
            <div class="setting-option">
                <label for="privacy-share-status-toggle">Partager mon statut "En soirée à..." avec mes amis</label>
                <label class="toggle-switch">
                    <input type="checkbox" id="privacy-share-status-toggle" ${currentUser.privacySettings.shareGoingOutStatus ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
        </div>`;

    document.getElementById('privacy-hide-profile-toggle')!.onchange = (e) => { currentUser!.privacySettings.hideProfileInPartySearch = (e.target as HTMLInputElement).checked; };
    document.getElementById('privacy-share-status-toggle')!.onchange = (e) => { currentUser!.privacySettings.shareGoingOutStatus = (e.target as HTMLInputElement).checked; };
}

function renderAccountSettingScreen() {
    if (!currentUser) return;
    const contentEl = document.getElementById('account-settings-content')!;
    contentEl.innerHTML = `
        <div class="setting-section">
            <h4>Informations du compte</h4>
            <div class="account-info-item">
                <p>E-mail: <span id="account-current-email">${currentUser.email}</span></p>
                <button class="change-button" id="change-email-trigger">Modifier</button>
            </div>
            <div class="account-info-item">
                <p>Téléphone: <span id="account-current-phone">${currentUser.phoneNumber}</span></p>
                <button class="change-button" id="change-phone-trigger">Modifier</button>
            </div>
             <div class="account-info-item">
                <p>Mot de passe</p>
                <button class="change-button" id="change-password-trigger">Modifier</button>
            </div>
        </div>
        <div class="setting-section">
             <h4>Actions sur le compte</h4>
            <button id="btn-delete-account" class="button" style="background-color: var(--danger-color);">Supprimer le compte</button>
        </div>
    `;
    
    document.getElementById('change-email-trigger')?.addEventListener('click', () => {
        (document.getElementById('current-email-display') as HTMLElement).textContent = currentUser!.email;
        showModal('change-email-modal');
    });
    document.getElementById('change-phone-trigger')?.addEventListener('click', () => {
        (document.getElementById('current-phone-display') as HTMLElement).textContent = currentUser!.phoneNumber;
        (document.getElementById('phone-verification-email-info') as HTMLElement).textContent = currentUser!.email;
        showModal('change-phone-modal');
    });
    document.getElementById('change-password-trigger')?.addEventListener('click', () => showModal('change-password-modal'));

    document.getElementById('btn-delete-account')?.addEventListener('click', () => {
        if (confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
            // Simulate deletion
            allUsers = allUsers.filter(u => u.id !== currentUser!.id);
            alert("Compte supprimé (simulation).");
            isUserLoggedIn = false;
            currentUser = null;
            currentUserId = null;
            sessionStorage.clear();
            navigateTo('login-screen');
        }
    });
}

function renderHelpSettingScreen() {
    const contentEl = document.getElementById('help-settings-content')!;
    contentEl.innerHTML = `
        <div class="setting-section">
            <h4>FAQ</h4>
            <details>
                <summary>Comment fonctionne FaceParty ?</summary>
                <div class="faq-answer">
                    <p>FaceParty vous permet de découvrir des soirées autour de vous, de voir qui y participe et de créer des connexions (Facelikes, Facematchs) avec d'autres utilisateurs. Utilisez les filtres pour affiner vos recherches et le moteur de suggestions IA pour des recommandations personnalisées.</p>
                </div>
            </details>
            <details>
                <summary>Mes données sont-elles sécurisées ?</summary>
                <div class="faq-answer">
                    <p>Nous prenons la sécurité de vos données très au sérieux. Cette application est un prototype et n'utilise pas de serveur réel pour stocker vos données. Toutes les informations sont gérées localement dans votre navigateur.</p>
                </div>
            </details>
             <details>
                <summary>Comment fonctionnent les suggestions IA ?</summary>
                <div class="faq-answer">
                    <p>Les suggestions IA analysent votre profil (y compris vos préférences privées) et le profil des autres participants à une soirée pour vous proposer des personnes avec qui vous pourriez avoir une bonne compatibilité. Vous pouvez choisir de voir qui pourrait vous plaire, à qui vous pourriez plaire, ou des matchs mutuels.</p>
                </div>
            </details>
        </div>
        <div class="setting-section contact-info">
            <h4>Nous Contacter</h4>
            <p>Pour toute question ou assistance, contactez-nous :</p>
            <a href="mailto:support@faceparty.app">support@faceparty.app</a>
        </div>
        <div class="setting-section terms-links">
            <h4>Légal</h4>
            <a href="#" onclick="alert('Affichage des Termes & Conditions (simulation)')">Termes & Conditions</a>
            <a href="#" onclick="alert('Affichage de la Politique de Confidentialité (simulation)')">Politique de Confidentialité</a>
        </div>
    `;
}

function renderAiSuggestions() {
     if (!currentUser || !currentPartyContext) {
        document.getElementById('ai-suggestions-list-container')!.innerHTML = "<p class='empty-list-message'>Suggestions non disponibles.</p>";
        return;
    }
    const aiSuggestionsListContainer = document.getElementById('ai-suggestions-list-container')!;
    const suggestionType = currentAiSuggestionType; // or get from UI element if you add tabs/buttons
    const loadingIndicator = document.getElementById('ai-loading-indicator');
    
    // Update ranking title
    const rankingTitleEl = document.getElementById('ai-current-ranking-title');
    if(rankingTitleEl) {
        if(currentAiSuggestionType === 'appealsToMe') rankingTitleEl.textContent = "Classement des personnes susceptibles de ME PLAIRE";
        else if(currentAiSuggestionType === 'iAppealTo') rankingTitleEl.textContent = "Classement des personnes à qui JE POURRAIS PLAIRE";
        else rankingTitleEl.textContent = "Classement des MATCHS MUTUELS potentiels";
    }

    // This function will now primarily render based on pre-fetched suggestions
    // The actual fetching is done in setupAiSuggestionEngine or when type changes
    const suggestionsToRender = (window as any).currentAiSuggestionsData || [];


    if (suggestionsToRender.length === 0) {
        aiSuggestionsListContainer.innerHTML = "<p class='empty-list-message'>Aucune suggestion pour le moment pour ce critère.</p>";
        return;
    }

    aiSuggestionsListContainer.innerHTML = suggestionsToRender.map((p: User) => `
         <div class="participant-card ai-suggestion-card">
            <div class="participant-card-clickable-area" data-user-id="${p.id}" role="button" tabindex="0" aria-label="View profile of ${p.name}">
                <img src="${p.profilePic}" alt="${p.name}">
                <div class="participant-info">
                    <h3>${p.name}, ${p.age}</h3>
                    <p class="drink"><i class="fas fa-cocktail"></i> ${p.favoriteDrink.toUpperCase()}</p>
                    <p class="bio">"${p.bio.substring(0, 50)}${p.bio.length > 50 ? '...' : ''}"</p>
                </div>
            </div>
            <button class="facelike-button-participant-card ${p.isFaceliked ? 'liked' : ''}" data-user-id="${p.id}" aria-label="Facelike ${p.name}">
                <i class="${p.isFaceliked ? 'fas' : 'far'} fa-heart"></i>
            </button>
        </div>
    `).join('');

    aiSuggestionsListContainer.querySelectorAll('.participant-card-clickable-area').forEach(card => {
        card.addEventListener('click', (e) => {
            const userId = (e.currentTarget as HTMLElement).dataset.userId;
            const participant = allUsers.find(p => p.id === userId);
            if (participant) navigateTo('participant-profile-screen', { participant, source: 'ai-suggestions' });
        });
    });
    aiSuggestionsListContainer.querySelectorAll('.facelike-button-participant-card').forEach(button => {
        button.addEventListener('click', (e) => {
            const userId = (e.currentTarget as HTMLElement).dataset.userId;
            toggleFacelike(userId!, 'ai-suggestions');
        });
    });
}

// --- END OF NEW/PLACEHOLDER FUNCTIONS ---


// AI Suggestion Engine Setup
(window as any).currentAiSuggestionsData = []; // Store current suggestions globally for renderAiSuggestions

async function getAiProfileSuggestions(userProfile: User, partyAttendees: User[], type: 'appealsToMe' | 'iAppealTo' | 'mutualMatch'): Promise<User[]> {
    if (!process.env.API_KEY) {
        console.error("API Key not found for Gemini.");
        document.getElementById('ai-suggestions-list-container')!.innerHTML = "<p class='empty-list-message' style='color:var(--danger-color)'>Erreur: Clé API manquante.</p>";
        return [];
    }
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

    let prompt = `Utilisateur actuel: ID: ${userProfile.id}, Nom: ${userProfile.name}, Âge: ${userProfile.age} ans, Genre: ${userProfile.gender}${userProfile.detailedGender ? ` (${userProfile.detailedGender})` : ''}. Ma description: "${userProfile.privatePreferences.selfDescription}". Je recherche: "${userProfile.privatePreferences.partnerDescription}".\n\n`;
    prompt += `Liste des autres participants à la soirée (limité à 10 pour la démo, ne pas inclure l'utilisateur actuel):\n`;
    
    const sampleAttendees = partyAttendees
        .filter(p => p.id !== userProfile.id) // Ensure current user is not in the list
        .slice(0, 10);

    if (sampleAttendees.length === 0) {
        document.getElementById('ai-suggestions-list-container')!.innerHTML = "<p class='empty-list-message'>Pas d'autres participants pour les suggestions.</p>";
        return [];
    }

    sampleAttendees.forEach(p => {
        prompt += `- ID: ${p.id}, Nom: ${p.name}, Âge: ${p.age}, Genre: ${p.gender}${p.detailedGender ? ` (${p.detailedGender})` : ''}, Bio: "${p.bio}", Description partenaire recherché: "${p.privatePreferences.partnerDescription}".\n`;
    });

    if (type === 'appealsToMe') {
        prompt += `\nQui, parmi ces participants, correspond le mieux aux préférences de recherche de "${userProfile.name}" (ID ${userProfile.id})? Réponds avec une liste d'IDs séparés par des virgules (ex: u1,u2,u3). Maximum 3 IDs. Ne pas inclure ${userProfile.id}.`;
    } else if (type === 'iAppealTo') {
        prompt += `\nQui, parmi ces participants, recherche activement quelqu'un comme "${userProfile.name}" (ID ${userProfile.id}), basé sur LEURS descriptions de partenaire recherché ? Réponds avec une liste d'IDs séparés par des virgules. Maximum 3 IDs. Ne pas inclure ${userProfile.id}.`;
    } else { // mutualMatch
        prompt += `\nQui, parmi ces participants, représenterait un bon MATCH MUTUEL avec "${userProfile.name}" (ID ${userProfile.id}), où les préférences de recherche des deux personnes sont satisfaites ? Réponds avec une liste d'IDs séparés par des virgules. Maximum 3 IDs. Ne pas inclure ${userProfile.id}.`;
    }
    
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
            config: { thinkingConfig: { thinkingBudget: 0 } }
        });

        const textResponse = response.text.trim();
        const suggestedIds = textResponse.split(',').map(id => id.trim()).filter(id => id.startsWith('u') && id !== userProfile.id);
        
        (window as any).currentAiSuggestionsData = allUsers.filter(u => suggestedIds.includes(u.id));
        return (window as any).currentAiSuggestionsData;

    } catch (error) {
        console.error("Erreur Gemini API:", error);
         document.getElementById('ai-suggestions-list-container')!.innerHTML = "<p class='empty-list-message' style='color:var(--danger-color)'>Erreur lors de la récupération des suggestions IA.</p>";
        (window as any).currentAiSuggestionsData = [];
        return [];
    }
}


function setupAiSuggestionEngine() {
    const aiButton = document.getElementById('ai-suggestion-trigger-button'); // Updated ID
    const finishButton = document.getElementById('btn-finish-ai-suggestions');
    const aiEngineArea = document.getElementById('ai-suggestion-engine-area');
    const suggestionsListContainer = document.getElementById('ai-suggestions-list-container');
    const loadingIndicator = document.getElementById('ai-loading-indicator');
    const suggestionTypeButtons = document.querySelectorAll('.ai-suggestion-type-button');

    async function fetchAndRenderSuggestions() {
        if (!currentUser || !currentPartyContext) return;
        if (loadingIndicator) loadingIndicator.style.display = 'block';
        if (suggestionsListContainer) suggestionsListContainer.innerHTML = ''; // Clear previous suggestions
        
        const partyAttendees = allUsers.filter(u => u.isGoingOut && u.goingOutToPartyId === currentPartyContext!.id && u.id !== currentUser.id);
        await getAiProfileSuggestions(currentUser, partyAttendees, currentAiSuggestionType); // This updates (window as any).currentAiSuggestionsData
        
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        renderAiSuggestions(); // This will use the fetched suggestions
    }
    
    aiButton?.addEventListener('click', async () => {
        if (!currentUser || !currentPartyContext) return;
        if (aiEngineArea) aiEngineArea.style.display = 'block';
        if (finishButton) finishButton.style.display = 'block';
        if (aiButton) (aiButton as HTMLButtonElement).style.display = 'none';
        
        // Set default active button if not already set
        if (!document.querySelector('.ai-suggestion-type-button.active')) {
             document.getElementById('ai-suggestion-type-appealsToMe')?.classList.add('active');
             currentAiSuggestionType = 'appealsToMe';
        }
        await fetchAndRenderSuggestions();
    });

    finishButton?.addEventListener('click', () => {
        if (aiEngineArea) aiEngineArea.style.display = 'none';
        if (finishButton) finishButton.style.display = 'none';
        if (aiButton) (aiButton as HTMLButtonElement).style.display = 'block';
        if (suggestionsListContainer) suggestionsListContainer.innerHTML = '';
        (window as any).currentAiSuggestionsData = []; // Clear stored suggestions
    });

    suggestionTypeButtons.forEach(button => {
        button.addEventListener('click', async () => {
            if (!currentUser || !currentPartyContext) return;
            suggestionTypeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentAiSuggestionType = button.getAttribute('data-type') as 'appealsToMe' | 'iAppealTo' | 'mutualMatch';
            
            await fetchAndRenderSuggestions();
        });
    });
}



// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    // Check session storage for logged-in state
    const loggedIn = sessionStorage.getItem('isFacePartyLoggedIn');
    const storedUserId = sessionStorage.getItem('facePartyCurrentUserId');

    if (loggedIn === 'true' && storedUserId) {
        const user = allUsers.find(u => u.id === storedUserId);
        if (user) {
            isUserLoggedIn = true;
            currentUser = ensureUserDetails(user); // Ensure all fields are present
            currentUserId = user.id;
            navigateTo('home-screen');
        } else {
            navigateTo('login-screen'); // User not found, clear session and go to login
             sessionStorage.clear();
        }
    } else {
        navigateTo('login-screen');
    }
    
    // Back button functionality
    document.querySelectorAll('.back-button').forEach(button => {
        button.addEventListener('click', goBack);
    });

    // Navigation bar functionality
    document.getElementById('nav-home')?.addEventListener('click', () => navigateTo('home-screen'));
    document.getElementById('nav-search')?.addEventListener('click', () => navigateTo('search-screen'));
    document.getElementById('nav-messages')?.addEventListener('click', () => navigateTo('messaging-screen'));
    document.getElementById('nav-profile')?.addEventListener('click', () => navigateTo('profile-screen'));
    
    // Home screen buttons to other main screens
    document.getElementById('home-messages-button')?.addEventListener('click', () => navigateTo('messaging-screen'));
    document.getElementById('btn-friends')?.addEventListener('click', () => navigateTo('friends-screen'));
    document.getElementById('btn-stats')?.addEventListener('click', () => navigateTo('statistics-screen'));
    document.getElementById('btn-settings')?.addEventListener('click', () => navigateTo('settings-screen'));


    document.getElementById('home-facematch-stat-trigger')?.addEventListener('click', () => navigateTo('facematches-today-screen')); // Corrected ID
    document.getElementById('home-facelike-stat-trigger')?.addEventListener('click', () => navigateTo('facelikes-screen'));   // Corrected ID
    
    document.getElementById('edit-profile-info-button')?.addEventListener('click', toggleProfileEdit);
    
    // Filters for party participants screen
    document.getElementById('filter-gender')?.addEventListener('change', () => {
        if(currentPartyContext) renderPartyParticipants(currentPartyContext);
    });
    document.getElementById('filter-country')?.addEventListener('input', () => {
         if(currentPartyContext) renderPartyParticipants(currentPartyContext);
    });
     document.getElementById('filter-height')?.addEventListener('change', () => {
        if (currentPartyContext) renderPartyParticipants(currentPartyContext);
    });
    document.getElementById('filter-eye-color')?.addEventListener('change', () => {
        if (currentPartyContext) renderPartyParticipants(currentPartyContext);
    });
    document.getElementById('filter-hair-color')?.addEventListener('change', () => {
        if (currentPartyContext) renderPartyParticipants(currentPartyContext);
    });
    document.getElementById('filter-specific-gender')?.addEventListener('change', () => {
        if (currentPartyContext) renderPartyParticipants(currentPartyContext);
    });
    
    // Age filter dropdown toggle
    const ageFilterButton = document.getElementById('filter-age-button');
    const ageFilterDropdown = document.getElementById('filter-age-checkboxes-list'); // Corrected ID for dropdown content
    ageFilterButton?.addEventListener('click', (e) => {
        e.stopPropagation(); 
        if (ageFilterDropdown) {
            ageFilterDropdown.style.display = ageFilterDropdown.style.display === 'block' ? 'none' : 'block';
            ageFilterButton.setAttribute('aria-expanded', ageFilterDropdown.style.display === 'block' ? 'true': 'false');
        }
    });
    document.addEventListener('click', (e) => {
        if (ageFilterDropdown && ageFilterButton && 
            !ageFilterButton.contains(e.target as Node) && 
            !ageFilterDropdown.contains(e.target as Node)) {
            ageFilterDropdown.style.display = 'none';
            ageFilterButton.setAttribute('aria-expanded', 'false');
        }
    });


    // Messaging screen "New Chat" button
    document.getElementById('messaging-screen-new-message-button')?.addEventListener('click', () => navigateTo('new-chat-friends-screen'));

    // Forgot password modal buttons
    document.getElementById('forgot-password-send-email')?.addEventListener('click', () => handleForgotPasswordSend('email'));
    document.getElementById('forgot-password-send-phone')?.addEventListener('click', () => handleForgotPasswordSend('phone'));
    document.getElementById('actual-forgot-password-modal-close-button')?.addEventListener('click', () => closeModal('forgot-password-modal'));


     // Share party modal buttons
    document.getElementById('actual-share-party-modal-close-button')?.addEventListener('click', () => closeModal('share-party-modal'));
    document.getElementById('share-party-send-button')?.addEventListener('click', handleSharePartySubmit); // Corrected ID
    document.getElementById('share-party-copy-link-button')?.addEventListener('click', () => {
        if (currentPartyContext) {
            navigator.clipboard.writeText(`https://face.party/join/${currentPartyContext.id}`)
                .then(() => {
                    const feedbackEl = document.getElementById('share-party-feedback');
                    if (feedbackEl) {
                        feedbackEl.textContent = "Lien de la soirée copié !";
                        feedbackEl.style.color = 'var(--success-color)';
                    }
                })
                .catch(err => console.error('Failed to copy party link:', err));
        }
    });
    
    // QR Code Modal
    document.getElementById('show-qr-code-button')?.addEventListener('click', () => {
        if (currentUser) {
            (document.getElementById('my-qr-code-img') as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUser.qrCodeData)}`;
            (document.getElementById('my-qr-code-data-text') as HTMLElement).textContent = currentUser.qrCodeData;
            showModal('qr-code-modal');
        }
    });
    document.getElementById('actual-close-qr-modal-button')?.addEventListener('click', () => closeModal('qr-code-modal'));


    // Participants screen header buttons
    document.getElementById('participants-filter-toggle-button')?.addEventListener('click', () => {
        const filters = document.querySelector('.filter-controls') as HTMLElement;
        if (filters) filters.style.display = filters.style.display === 'none' ? 'grid' : 'none';
    });
    document.getElementById('btn-lineup')?.addEventListener('click', () => {
        if (currentPartyContext) navigateTo('lineup-details-screen', {party: currentPartyContext});
    });
    document.getElementById('btn-my-facelikes')?.addEventListener('click', () => navigateTo('facelikes-screen'));

    // AI Suggestion Engine Setup
    setupAiSuggestionEngine();
    
    //Modal close buttons
    document.getElementById('actual-change-email-modal-close-button')?.addEventListener('click', () => closeModal('change-email-modal'));
    document.getElementById('actual-change-phone-modal-close-button')?.addEventListener('click', () => closeModal('change-phone-modal'));
    document.getElementById('actual-change-password-modal-close-button')?.addEventListener('click', () => closeModal('change-password-modal'));


});

// Ensure currentUser is always fully populated when set
function setCurrentUser(user: User | null) {
    if (user) {
        currentUser = ensureUserDetails(user);
        currentUserId = user.id;
    } else {
        currentUser = null;
        currentUserId = null;
    }
}
window.addEventListener('beforeunload', () => {
    // Optional: Persist data to localStorage if desired for a more robust "session"
    // For now, only login state is persisted via sessionStorage.
});

// Add the ai object and its types if you plan to use it globally,
// or initialize it where needed. For now, it's initialized within getAiProfileSuggestions.
// const ai = new GoogleGenAI({apiKey: process.env.API_KEY}); // Ensure API_KEY is set in your environment
// console.log("index.tsx loaded");
// Make functions globally available for HTML onclick if not using modules + bundler properly
(window as any).navigateTo = navigateTo;
(window as any).goBack = goBack;
(window as any).toggleProfileEdit = toggleProfileEdit;
(window as any).handleJoinParty = handleJoinParty; // Example
(window as any).toggleFacelike = toggleFacelike;
(window as any).sendFriendRequest = sendFriendRequest;
(window as any).removeFriend = removeFriend;
(window as any).showModal = showModal;
(window as any).closeModal = closeModal;
(window as any).handleSharePartySubmit = handleSharePartySubmit;
(window as any).handlePartyCommentSubmit = handlePartyCommentSubmit; // Make sure it's accessible

(window as any).handleForgotPasswordSend = handleForgotPasswordSend; // Make globally accessible
(window as any).handleForgotPasswordLinkClick = handleForgotPasswordLinkClick; // Make globally accessible
// Add other global functions as needed for HTML event handlers


// Ensure all screens are hidden by default except the one managed by navigateTo
document.querySelectorAll('.screen').forEach(screen => {
    if (screen.id !== currentScreenId) { // currentScreenId is 'login-screen' by default
        (screen as HTMLElement).classList.remove('active');
    } else {
        (screen as HTMLElement).classList.add('active');
    }
});
