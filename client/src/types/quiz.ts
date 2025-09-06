export type QuizAnswer = 'A' | 'B' | 'C';

export interface QuizAnswers {
  [questionNumber: number]: QuizAnswer;
}

export interface QuizData {
  nome: string;
  email: string;
  whatsapp?: string;
  answers: QuizAnswers;
}

export interface Question {
  id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
  };
}

export const QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "Seus filhos presenciam suas brigas?",
    options: {
      A: "Sim, e isso me mata por dentro todos os dias",
      B: "Às vezes, mas tento esconder (sei que eles percebem tudo)",
      C: "Não tenho filhos, mas pretendo ter"
    }
  },
  {
    id: 2,
    question: "Qual a idade dos seus filhos?",
    options: {
      A: "Pequenos (0-6 anos) - ainda posso protegê-los",
      B: "Pré-adolescentes (7-12 anos) - estou na última chance",
      C: "Adolescentes (13+ anos) - pode ser tarde demais"
    }
  },
  {
    id: 3,
    question: "Com que frequência vocês explodem em discussões?",
    options: {
      A: "Várias vezes por semana - virou um inferno",
      B: "Pelo menos uma vez por semana - intensamente",
      C: "Algumas vezes por mês, mas são brigas destruidoras"
    }
  },
  {
    id: 4,
    question: "Seus filhos já imploraram para vocês pararem?",
    options: {
      A: "Sim, e isso despedaçou meu coração completamente",
      B: "Eles choram ou ficam apavorados quando brigamos",
      C: "Vejo o medo nos olhos deles quando começamos"
    }
  },
  {
    id: 5,
    question: "Como você se sente sabendo que está prejudicando seus filhos?",
    options: {
      A: "Destruída - sou a pior mãe do mundo",
      B: "Desesperada - não consigo parar mesmo sabendo do mal",
      C: "Culpada - sei que estou falhando com eles"
    }
  },
  {
    id: 6,
    question: "O que mais te desespera nessas brigas?",
    options: {
      A: "Ver o terror nos olhos dos meus filhos",
      B: "Saber que estou ensinando eles que amor dói",
      C: "Perceber que eles estão perdendo a inocência"
    }
  },
  {
    id: 7,
    question: "Como seu marido reage durante as discussões?",
    options: {
      A: "Grita de volta na frente das crianças",
      B: "Sai batendo a porta, deixando todos abalados",
      C: "Fica em silêncio, mas o clima fica pesado por dias"
    }
  },
  {
    id: 8,
    question: "Você percebe seus filhos mudando por causa das brigas?",
    options: {
      A: "Sim, eles estão mais agressivos e nervosos",
      B: "Ficaram mais quietos e retraídos",
      C: "Começaram a ter pesadelos ou problemas na escola"
    }
  },
  {
    id: 9,
    question: "Você tem medo de estar traumatizando seus filhos para sempre?",
    options: {
      A: "Sim, tenho pavor de estar destruindo eles",
      B: "Morro de medo de que eles me odeiem no futuro",
      C: "Tenho certeza de que já causei danos irreparáveis"
    }
  },
  {
    id: 10,
    question: "Como você se sente quando vê outros casais harmoniosos com filhos?",
    options: {
      A: "Morto de inveja - queria que fossem meus filhos",
      B: "Devastada - sei que meus filhos merecem isso",
      C: "Envergonhada - sou um exemplo terrível de mãe"
    }
  },
  {
    id: 11,
    question: "Qual seu maior medo sobre o futuro dos seus filhos?",
    options: {
      A: "Que tenham relacionamentos tóxicos por minha culpa",
      B: "Que nunca consigam ser felizes no amor",
      C: "Que me culpem para sempre por ter arruinado eles"
    }
  },
  {
    id: 12,
    question: "Você já teve pesadelos com seus filhos adultos te confrontando?",
    options: {
      A: "Sim, acordo suando pensando nisso",
      B: "Tenho pavor do dia em que eles me perguntarem \"por quê?\"",
      C: "Sei que um dia vão me odiar pelo que fiz"
    }
  },
  {
    id: 13,
    question: "Você faria QUALQUER COISA para proteger seus filhos agora?",
    options: {
      A: "SIM! Qualquer sacrifício pelos meus filhos",
      B: "Com certeza, eles são minha prioridade absoluta",
      C: "Sem dúvida, não posso falhar mais com eles"
    }
  },
  {
    id: 14,
    question: "Se pudesse voltar no tempo e mudar tudo em 7 dias, mudaria?",
    options: {
      A: "Imediatamente, daria qualquer coisa por essa chance",
      B: "Sem hesitar, não aguento mais ver eles sofrendo",
      C: "É meu último desejo na vida - salvar meus filhos"
    }
  },
  {
    id: 15,
    question: "Quanto vale o futuro e felicidade dos seus filhos?",
    options: {
      A: "Não tem preço - são meus tesouros mais preciosos",
      B: "Vale minha própria vida - faria qualquer coisa por eles",
      C: "É mais importante que qualquer outra coisa no mundo"
    }
  }
];
