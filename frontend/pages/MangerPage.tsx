

import React from 'react';
import { CreditCardIcon, RestaurantIcon, DownloadIcon } from '../components/icons/Icons';

// Déclaration pour informer TypeScript de l'existence de jspdf dans la portée globale
declare const jspdf: any;

const MangerPage: React.FC = () => {

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
        e.preventDefault();
        window.location.hash = href;
    }
  };
  
  const handleDownloadAdmissionForm = () => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    // --- PAGE 1 ---
    const page1 = () => {
        doc.setFontSize(16);
        doc.setFont('times', 'bolditalic');
        doc.text("la pause", 20, 20);
        doc.setFontSize(32);
        doc.setTextColor(0, 154, 88); // Agria Green
        doc.text("Agria", 38, 20);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text("Le restaurant de la cité", 28, 26);

        // Title
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("DEMANDE D'ADMISSION", 105, 40, { align: 'center' });
        doc.text("AU RESTAURANT INTER ADMINISTRATIF", 105, 46, { align: 'center' });

        // Subtitle
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        const subTitle = "(À REMETTRE, DÛMENT RENSEIGNÉE ET SIGNÉE (recto et verso), AU GUICHET CENTRAL DE L'AGRIA)";
        doc.text(subTitle, 105, 52, { align: 'center' });
        
        let y = 62;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text("EN QUALITÉ DE :", 20, y);
        y += 7;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        // Left column
        doc.rect(20, y, 3, 3); doc.text("AGENT EN ACTIVITÉ", 25, y+2.5);
        doc.rect(20, y+7, 3, 3); doc.text("AGENT EN RETRAITE", 25, y+9.5);
        doc.text("(4)", 63, y+9.5, { charSpace: 0});
        doc.rect(20, y+14, 3, 3); doc.text("CONJOINT ou CONCUBIN", 25, y+16.5);
        doc.text("(1) (2)", 73, y+16.5, { charSpace: 0});
        doc.rect(20, y+21, 3, 3); doc.text("ENFANT âgé de – 23 ans", 25, y+23.5);
        doc.text("(1) (3)", 72, y+23.5, { charSpace: 0});
        
        // Right column
        doc.text("DE SERVICES DÉCONCENTRÉS DE L'ÉTAT", 95, y+2.5);
        doc.text("D'UN AGENT TITULAIRE D'UNE CARTE INDIVIDUELLE", 95, y+16.5);
        doc.text("D'ADMISSION À L'AGRIA", 95, y+21.5);
        
        y+=30;

        const addLineField = (label: string, startX: number, startY: number, lineStartX: number, lineEndX = 190) => {
            doc.text(label, startX, startY, { baseline: 'bottom' });
            doc.line(lineStartX, startY, lineEndX, startY);
        };
        
        doc.setFontSize(8);
        addLineField("(1) Nom et prénom du conjoint ou concubin ou, selon le cas, du parent, titulaire d'une carte individuelle", 20, y, 20);
        y += 4;
        addLineField("d'admission à l'AGRIA :", 20, y, 65);
        y += 7;
        addLineField("(1) Administration d'appartenance de celui-ci :", 20, y, 98);
        y += 10;

        doc.setFontSize(10);
        doc.rect(20, y-2.5, 3, 3); doc.text("M.", 25, y);
        doc.rect(35, y-2.5, 3, 3); doc.text("Mme", 40, y);
        doc.rect(55, y-2.5, 3, 3); doc.text("Melle", 60, y);
        y += 7;
        addLineField("Nom :", 20, y, 30);
        y += 7;
        addLineField("Prénom :", 20, y, 35);
        y += 7;
        doc.text("Date de naissance : jour |__|__| mois |__|__| année |__|__|__|__|", 20, y);
        y += 7;
        addLineField("Lieu de naissance :", 20, y, 55);
        doc.text("Dép. : |__|__|", 160, y);
        y += 7;
        doc.text("Pour les agents : Numéro de téléphone professionnel : | 0 |__|__|__|__|__|__|__|__|__|", 20, y);
        y += 7;
        addLineField("Pour les retraités : Adresse personnelle :", 20, y, 80);
        y += 15;

        doc.setFont('helvetica', 'normal');
        doc.text("demande la délivrance d'une carte individuelle d'admission au restaurant interadministratif de Rouen ;", 25, y);
        y += 7;
        doc.text("atteste avoir pris connaissance et accepte de se conformer aux dispositions du règlement intérieur", 25, y);
        doc.text("du restaurant interadministratif et de la cafétéria affiché dans les locaux, accessible à tous sur le site", 25, y+4);
        doc.text("internet de l'AGRIA et dont un exemplaire lui est remis à sa demande expresse.", 25, y+8);
        
        doc.text("Signature", 170, y+15);
        y += 27;

        addLineField("Fait à", 20, y, 30, 75);
        addLineField("le", 80, y, 85, 115);
        doc.text("20....", 120, y);
        y += 15;
        
        doc.setFontSize(7);
        doc.text("Vous disposez à tout moment d'un droit d'accès et de rectification aux informations vous concernant conservées dans nos fichiers dans le cadre de la gestion de votre compte (articles 39 et 40 de la loi \"informatique et libertés\" n° 78-17 du 6 janvier 1978 modifiée).", 105, y, { align: 'center', maxWidth: 180 });
        y += 15;
        
        doc.setFontSize(8);
        doc.text("ASSOCIATION DE GESTION DU RESTAURANT INTER ADMINISTRATIF, Association déclarée régie par la loi du 1er juillet 1901", 105, y, { align: 'center' });
        y += 4;
        doc.text("BP 56008 76032 ROUEN CEDEX", 105, y, { align: 'center' });
        y += 4;
        doc.text("TÉL. : 02.32.18.97.80 - FAX : 02.32.18.97.89", 105, y, { align: 'center' });
        y += 4;
        doc.text("COURRIEL : secretariatagria@free.fr, Internet : www.agriarouen.fr", 105, y, { align: 'center' });
    };
    
    const page2 = () => {
        doc.addPage();
        let y = 20;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text("PIÈCES JUSTIFICATIVES À PRODUIRE PAR LE DEMANDEUR :", 105, y, { align: 'center' });
        y += 10;

        doc.setFontSize(9);
        const justifications = [
            ["(2)", "pour les époux/concubins/pacsés :", "joindre selon le cas une photocopie du livret de famille (extrait de l'acte de mariage) ou un récépissé d'enregistrement de pacs ou une déclaration sur l'honneur de lien matrimonial ou de concubinage."],
            ["(3)", "pour les enfants :", "joindre une photocopie du livret de famille (extrait de l'acte de naissance) ou une copie ou extrait de l'acte de naissance de l'enfant ou une déclaration sur l'honneur de filiation."],
            ["(3)", "pour les enfants âgés de plus de 16 ans :", "joindre également un certificat du chef de l'établissement d'enseignement attestant de la poursuite d'études secondaires ou supérieures ou du suivi d'une formation professionnelle en alternance."],
            ["(4)", "pour les retraités :", "joindre une copie du dernier bulletin de pension."],
        ];
        
        justifications.forEach(line => {
            const textLines = doc.splitTextToSize(line[2], 105);
            doc.setFont('helvetica', 'normal'); doc.text(line[0], 20, y);
            doc.setFont('helvetica', 'italic'); doc.text(line[1], 30, y);
            doc.setFont('helvetica', 'normal'); doc.text(textLines, 85, y);
            y += textLines.length * 4 + 4;
        });
        y+=5;
        
        doc.setLineWidth(0.5);
        doc.rect(15, y, 180, 145);
        y += 5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text("PARTIE À REMPLIR PAR L'ADMINISTRATION POUR LES AGENTS SUBVENTIONNES", 105, y, { align: 'center' });
        doc.text("TOUS LES CHAMPS DOIVENT ETRE COMPLETES", 105, y + 5, { align: 'center' });
        y += 15;
        
        const addLineField = (label: string, startX: number, startY: number, lineStartX: number, lineEndX = 190) => {
            doc.text(label, startX, startY, { baseline: 'bottom' });
            doc.line(lineStartX, startY, lineEndX, startY);
        };

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text("Le chef de service soussigné atteste que :", 20, y);
        y += 7;
        doc.rect(20, y-2.5, 3, 3); doc.text("M.", 25, y);
        doc.rect(35, y-2.5, 3, 3); doc.text("Mme", 40, y);
        doc.rect(55, y-2.5, 3, 3); doc.text("Melle", 60, y);
        y += 7;
        addLineField("NOM :", 20, y, 32);
        y += 7;
        addLineField("Prénom :", 20, y, 37);
        y += 7;
        doc.text("Date de naissance : jour |__|__| mois |__|__| année |__|__|__|__|", 20, y);
        y += 7;
        addLineField("Lieu de naissance :", 20, y, 55);
        doc.text("Dép. : |__|__|", 160, y);
        y += 10;
        
        doc.text("est actuellement affecté(e) au sein de ses services, en qualité de :", 20, y);
        y += 7;
        
        doc.rect(20, y, 3, 3); doc.text("Fonctionnaire - contractuel en CDI", 25, y+2.5);
        doc.rect(100, y, 3, 3); doc.text("stagiaire ou contractuel de moins d'un an (*)", 105, y+2.5);
        y += 5;
        doc.text("ou CDD de plus d'un an - retraité", 25, y);
        y += 5;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text("(*) barrer la mention inutile et préciser la situation exacte: agent en stage de formation initiale sans pré-affectation dans l'agglomération rouennaise, agent non titulaire sous contrat à durée déterminée etc.", 105, y, {maxWidth: 85});
        y += 20;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("indice nouveau majoré : |__|__|__| > OBLIGATOIRE POUR DETERMINER LA TARIFICATION", 20, y);
        y += 5;
        doc.text("> A DEFAUT LA TARIFICATION MAXIMALE SERA APPLIQUEE", 70, y);
        y += 7;
        
        addLineField("adresse de la résidence administrative (*) :", 20, y, 92);
        y += 5;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text("(*) dans le cas où cette résidence administrative serait située hors de l'agglomération rouennaise", 20, y);
        y += 7;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("certifie que cet agent se déplace au moins une fois par semaine à Rouen pour un motif d'ordre professionnel.", 20, y, {maxWidth: 170});
        y += 10;
        
        doc.text("Administration ou Ministère prenant en charge la rémunération du demandeur (OBLIGATOIRE) :", 20, y);
        y += 5;
        doc.line(20, y, 190, y);
        y += 5;
        doc.text("(Voir sur les bulletins de paie)", 140, y);
        y += 15;
        
        addLineField("Fait à", 20, y, 30, 80);
        addLineField("le...", 160, y, 168, 190);
        y += 15;
        doc.text("Cachet de l'Administration", 30, y);
        doc.text("Signature du service des", 140, y);
        doc.text("Ressources Humaines", 143, y + 5);
    };

    page1();
    page2();
    
    doc.save("demande-admission-agria.pdf");
  };


  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Manger à l'AGRIA</h1>
      <p className="text-lg text-gray-600 mb-8">Rejoignez-nous pour une pause déjeuner savoureuse ! Voici comment procéder :</p>
      
      <div className="space-y-8">

        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200/80 flex flex-col sm:flex-row items-center sm:items-start gap-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-center sm:text-left">
            <div className="flex-shrink-0 bg-agria-green text-white rounded-full h-12 w-12 flex items-center justify-center font-bold text-xl">1</div>
            <div>
                <h2 className="text-2xl font-bold text-agria-green-dark mb-2">Créez votre compte</h2>
                <p className="text-gray-700 mb-4">Vous pouvez créer votre compte en téléchargeant la demande d'admission, la remplir et nous la retourner.</p>
                <button onClick={handleDownloadAdmissionForm} className="bg-agria-green hover:bg-agria-green-dark text-white font-semibold py-2 px-4 rounded-md transition-colors inline-flex items-center gap-2">
                    <DownloadIcon className="h-5 w-5"/>
                    Télécharger la demande
                </button>
            </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200/80 flex flex-col sm:flex-row items-center sm:items-start gap-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-center sm:text-left">
            <div className="flex-shrink-0 bg-agria-green text-white rounded-full h-12 w-12 flex items-center justify-center font-bold text-xl">2</div>
            <div>
                <h2 className="text-2xl font-bold text-agria-green-dark mb-2">Rechargez votre carte</h2>
                <p className="text-gray-700 mb-4">Vous pouvez ajouter des fonds à votre carte directement en ligne ou sur place pour payer vos repas.</p>
                <a href="#recharge" onClick={(e) => handleNavClick(e, '#recharge')} className="bg-agria-green hover:bg-agria-green-dark text-white font-semibold py-2 px-4 rounded-md transition-colors inline-flex items-center gap-2">
                    <CreditCardIcon className="h-5 w-5"/>
                    Je recharge ma carte
                </a>
            </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200/80 flex flex-col sm:flex-row items-center sm:items-start gap-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-center sm:text-left">
            <div className="flex-shrink-0 bg-agria-green text-white rounded-full h-12 w-12 flex items-center justify-center font-bold text-xl">3</div>
            <div>
                <h2 className="text-2xl font-bold text-agria-green-dark mb-2">Bon appétit !</h2>
                <p className="text-gray-700 mb-4">C'est tout ! Vous êtes prêt à venir déguster nos plats. Présentez simplement votre carte lors de votre passage en caisse.</p>
                 <a href="#menu" onClick={(e) => handleNavClick(e, '#menu')} className="bg-agria-green hover:bg-agria-green-dark text-white font-semibold py-2 px-4 rounded-md transition-colors inline-flex items-center gap-2">
                    <RestaurantIcon className="h-5 w-5"/>
                    Voir le menu de la semaine
                </a>
            </div>
        </div>

      </div>
    </div>
  );
};

export default MangerPage;