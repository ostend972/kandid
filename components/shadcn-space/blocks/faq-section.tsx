'use client';

import { motion } from 'motion/react';

const faqs = [
  {
    question: "Pourquoi mon CV francais est-il rejete en Suisse ?",
    answer: "Le marche suisse attend un CV de 2 pages avec photo professionnelle, equivalences de diplomes (CFC, HES, Bachelor/Master), niveaux de langue certifies CECR (A1 a C2) et terminologie locale (contrat fixe au lieu de CDI). Un CV au format francais est souvent filtre automatiquement par les logiciels ATS des recruteurs suisses."
  },
  {
    question: "Qu'est-ce qu'un frontalier et ai-je besoin d'un permis G ?",
    answer: "Un frontalier est un travailleur residant en France (ou dans un pays limitrophe) qui traverse la frontiere quotidiennement pour travailler en Suisse. Le permis G est delivre automatiquement apres signature du contrat de travail — vous n'avez pas besoin de l'obtenir avant de postuler."
  },
  {
    question: "Kandid est-il vraiment gratuit ?",
    answer: "Oui. Pendant la phase beta, toutes les fonctionnalites sont accessibles gratuitement : analyse CV, recherche d'emploi parmi 20 000+ offres, et generation de dossier de candidature complet. Aucune carte de credit requise."
  },
  {
    question: "Comment fonctionne le matching IA avec les offres d'emploi ?",
    answer: "L'algorithme de Kandid compare votre profil extrait du CV (competences, langues, experience, secteur) avec les exigences de chaque offre. Il attribue un score de compatibilite sur 100 et identifie les lacunes a combler pour maximiser vos chances."
  },
];

export default function FaqSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="uppercase text-sm font-medium text-foreground mb-4">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
            Questions frequentes sur la recherche d&apos;emploi en Suisse
          </h2>
        </motion.div>
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="border-b border-border pb-6"
            >
              <h3 className="text-lg font-medium text-foreground mb-3">
                {faq.question}
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                {faq.answer}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
