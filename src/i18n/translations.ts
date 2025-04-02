export const translations = {
  en: {
    formulaEditor: "Formula Plotter",
    formulaEditorDescription: "Create and edit mathematical graphs",
    editor: "Editor",
    examples: "Examples",
    newFormula: "New Formula",
    formulaType: "Formula Type",
    functionYofX: "Function y = f(x)",
    parametricXYofT: "Parametric x(t), y(t)",
    polarRofTheta: "Polar r = f(θ)",
    color: "Color",
    strokeWidth: "Line Width",
    samples: "Data Points",
    functionExpression: "Enter function f(x)",
    parametricExpression: "Enter parametric equations",
    polarExpression: "Enter polar expression",
    functionExpressionHint: "Use JavaScript syntax: x*x, Math.sin(x), etc.",
    parametricExpressionHint: "Format: x(t); y(t) - use semicolon between expressions",
    polarExpressionHint: "Use 'theta' as the angle variable",
    xRange: "X Range",
    tRange: "T Range",
    thetaRange: "θ Range",
    deleteFormula: "Delete",
    use: "Use",
    categories: {
      basic: "Basic Functions",
      trigonometric: "Trigonometric",
      exponential: "Exponential",
      parametric: "Parametric Curves",
      special: "Special Curves",
      polynomial: "Polynomial Functions"
    },
    formulaPlotter: "Formula Plotter",
    openFormulaTool: "Open Formula Plotter",
    closeFormulaTool: "Close Formula Plotter",
    tooltips: {
      plot: "Plot formula",
      plotDescription: "Create mathematical graphs on the grid"
    },
    scaleFactor: "Scale Factor",
    scaleFactorHint: "Adjust to make the graph flatter or steeper",
    scaleMin: "0.001x",
    scaleDefault: "1.0x",
    scaleMax: "10.0x",
    formulaPlaceholder: "x*x",
    formulaDefault: "f(x)",
    exampleCategory: "Category",
    exampleName: "Name",
    exampleDescription: "Description",
    colorPicker: "Pick a color",
    deleteFormulaTooltip: "Delete this formula",
    browseExamples: "Browse examples",
    pointX: "X",
    pointY: "Y",
    calculation: "Calculation",
    calculationError: "Error calculating value",
    parametricPointInfo: "Parametric function (t value not available)",
    polarPointInfo: "Polar function (θ value not available)",
    pointInfoTitle: "Point Information",
    clickOnCurveInstruction: "Click on the curve to select a point and view its information.",
    gridZoom: 'Grid Zoom',
    gridZoomHint: 'Adjust the zoom level of the grid',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    zoomLevel: 'Zoom Level',
    zoomReset: 'Reset Zoom',
    showToolbar: "Show Toolbar",
    hideToolbar: "Hide Toolbar",
    configModal: {
      title: "Configuration",
      description: "Configure application settings",
      tabs: {
        general: "General",
        display: "Display",
        openai: "OpenAI API",
        developer: "Developer"
      },
      general: {
        description: "General application settings",
        languageLabel: "Language",
        languagePlaceholder: "Select a language"
      },
      display: {
        description: "Configure how the application looks and behaves.",
        toolbarVisibilityLabel: "Show Toolbar",
        toolbarVisibilityDescription: "Toggle the visibility of the toolbar. When hidden, you can still use keyboard shortcuts."
      },
      openai: {
        description: "OpenAI API settings",
        apiKeyLabel: "API Key",
        apiKeyPlaceholder: "Enter your OpenAI API key",
        apiKeyHint: "Your API key is stored locally and encrypted",
        clearApiKey: "Clear API key"
      },
      developer: {
        description: "Developer options",
        loggingLabel: "Logging level",
        loggingDescription: "Set the detail level of logs"
      },
      calibration: {
        title: "Calibration",
        description: "Calibrate your screen for accurate measurements",
        instructions: "To calibrate, measure a known distance on your screen",
        lengthLabel: "Reference length",
        startButton: "Start calibration",
        placeRuler: "Place a ruler on your screen",
        lineDescription: "Adjust the line to measure exactly {length} {unit}",
        coarseAdjustment: "Coarse adjustment",
        fineAdjustment: "Fine adjustment",
        currentValue: "Current value",
        pixelsPerUnit: "pixels/{unit}",
        cancelButton: "Cancel",
        applyButton: "Apply"
      }
    },
    formula: {
      title: "Formula",
      untitled: "Untitled",
      delete: "Delete",
      parameters: "Parameters",
      options: "Formula Options",
      optionsTooltip: "Configure formula settings",
      description: "Configure formula settings and parameters",
      name: "Name",
      minValue: "Min Value",
      maxValue: "Max Value",
      step: "Step",
      parameterRange: "Parameter Range",
      quickAdjust: "Quick Adjust",
      parameterName: "Display Name",
      tabs: {
        general: "General",
        parameters: "Parameters"
      },
      parametersDescription: "Configure formula parameters and their default values"
    },
  },
  es: {
    formulaEditor: "Trazador de Fórmulas",
    formulaEditorDescription: "Crea y edita gráficos matemáticos",
    editor: "Editor",
    examples: "Ejemplos",
    newFormula: "Nueva Fórmula",
    formulaType: "Tipo de Fórmula",
    functionYofX: "Función y = f(x)",
    parametricXYofT: "Paramétrica x(t), y(t)",
    polarRofTheta: "Polar r = f(θ)",
    color: "Color",
    strokeWidth: "Grosor de Línea",
    samples: "Puntos de Datos",
    functionExpression: "Introduzca función f(x)",
    parametricExpression: "Introduzca ecuaciones paramétricas",
    polarExpression: "Introduzca expresión polar",
    functionExpressionHint: "Use sintaxis JavaScript: x*x, Math.sin(x), etc.",
    parametricExpressionHint: "Formato: x(t); y(t) - use punto y coma entre expresiones",
    polarExpressionHint: "Use 'theta' como variable de ángulo",
    xRange: "Rango X",
    tRange: "Rango T",
    thetaRange: "Rango θ",
    deleteFormula: "Eliminar",
    use: "Usar",
    categories: {
      basic: "Funciones Básicas",
      trigonometric: "Trigonométricas",
      exponential: "Exponenciales",
      parametric: "Curvas Paramétricas",
      special: "Curvas Especiales",
      polynomial: "Funciones Polinómicas"
    },
    formulaPlotter: "Trazador de Fórmulas",
    openFormulaTool: "Abrir Trazador de Fórmulas",
    closeFormulaTool: "Cerrar Trazador de Fórmulas",
    tooltips: {
      plot: "Graficar fórmula",
      plotDescription: "Crear gráficos matemáticos en la cuadrícula"
    },
    scaleFactor: "Factor de Escala",
    scaleFactorHint: "Ajuste para hacer el gráfico más plano o más pronunciado",
    scaleMin: "0.001x",
    scaleDefault: "1.0x",
    scaleMax: "10.0x",
    formulaPlaceholder: "x*x",
    formulaDefault: "f(x)",
    exampleCategory: "Categoría",
    exampleName: "Nombre",
    exampleDescription: "Descripción",
    colorPicker: "Elegir un color",
    deleteFormulaTooltip: "Eliminar esta fórmula",
    browseExamples: "Explorar ejemplos",
    pointX: "X",
    pointY: "Y",
    calculation: "Cálculo",
    calculationError: "Error al calcular el valor",
    parametricPointInfo: "Función paramétrica (valor t no disponible)",
    polarPointInfo: "Función polar (valor θ no disponible)",
    pointInfoTitle: "Información del Punto",
    clickOnCurveInstruction: "Haz clic en la curva para seleccionar un punto y ver su información.",
    gridZoom: 'Zoom del Gird',
    gridZoomHint: 'Ajustar el nivel de zoom del grid',
    zoomIn: 'Acercar',
    zoomOut: 'Alejar',
    zoomLevel: 'Nivel de Zoom',
    zoomReset: 'Resetear Zoom',
    showToolbar: "Mostrar Barra de Herramientas",
    hideToolbar: "Ocultar Barra de Herramientas",
    configModal: {
      title: "Configuración",
      description: "Configurar ajustes de la aplicación",
      tabs: {
        general: "General",
        display: "Visualización",
        openai: "API de OpenAI",
        developer: "Desarrollador"
      },
      general: {
        description: "Ajustes generales de la aplicación",
        languageLabel: "Idioma",
        languagePlaceholder: "Seleccionar un idioma"
      },
      display: {
        description: "Configure cómo se ve y comporta la aplicación.",
        toolbarVisibilityLabel: "Mostrar Barra de Herramientas",
        toolbarVisibilityDescription: "Activa o desactiva la visibilidad de la barra de herramientas. Cuando está oculta, puedes seguir usando atajos de teclado."
      },
      openai: {
        description: "Configuración de la API de OpenAI",
        apiKeyLabel: "Clave API",
        apiKeyPlaceholder: "Ingresa tu clave API de OpenAI",
        apiKeyHint: "Tu clave API se almacena localmente y está cifrada",
        clearApiKey: "Borrar clave API"
      },
      developer: {
        description: "Opciones de desarrollador",
        loggingLabel: "Nivel de registro",
        loggingDescription: "Establecer el nivel de detalle de los registros"
      },
      calibration: {
        title: "Calibración",
        description: "Calibra tu pantalla para mediciones precisas",
        instructions: "Para calibrar, mide una distancia connida en tu pantalla",
        lengthLabel: "Longitud de referencia",
        startButton: "Iniciar calibración",
        placeRuler: "Coloca una regla en tu pantalla",
        lineDescription: "Ajusta la línea para medir exactamente {length} {unit}",
        coarseAdjustment: "Ajuste grueso",
        fineAdjustment: "Ajuste fino",
        currentValue: "Valor actual",
        pixelsPerUnit: "píxeles/{unit}",
        cancelButton: "Cancelar",
        applyButton: "Aplicar"
      }
    },
    formula: {
      title: "Fórmula",
      untitled: "Sin título",
      delete: "Eliminar",
      parameters: "Parámetros",
      options: "Opciones de fórmula",
      optionsTooltip: "Configurar ajustes de fórmula",
      description: "Configurar ajustes y parámetros de la fórmula",
      name: "Nombre de la fórmula",
      minValue: "Valor Mínimo",
      maxValue: "Valor Máximo",
      step: "Paso",
      parameterRange: "Rango de Parámetro",
      quickAdjust: "Ajustar Rápidamente",
      parameterName: "Nombre de visualización",
      tabs: {
        general: "General",
        parameters: "Parámetros"
      },
      parametersDescription: "Configurar parámetros de la fórmula y sus valores predeterminados"
    },
  },
  fr: {
    formulaEditor: "Traceur de Formules",
    formulaEditorDescription: "Créer et éditer des graphiques mathématiques",
    editor: "Éditeur",
    examples: "Exemples",
    newFormula: "Nouvelle Formule",
    formulaType: "Type de Formule",
    functionYofX: "Fonction y = f(x)",
    parametricXYofT: "Paramétrique x(t), y(t)",
    polarRofTheta: "Polaire r = f(θ)",
    color: "Couleur",
    strokeWidth: "Épaisseur de Ligne",
    samples: "Points de Données",
    functionExpression: "Entrez fonction f(x)",
    parametricExpression: "Entrez équations paramétriques",
    polarExpression: "Entrez expression polaire",
    functionExpressionHint: "Utilisez syntaxe JavaScript: x*x, Math.sin(x), etc.",
    parametricExpressionHint: "Format: x(t); y(t) - utilisez point-virgule entre expressions",
    polarExpressionHint: "Utilisez 'theta' comme variable angulaire",
    xRange: "Plage X",
    tRange: "Plage T",
    thetaRange: "Plage θ",
    deleteFormula: "Supprimer",
    use: "Utiliser",
    categories: {
      basic: "Fonctions Basiques",
      trigonometric: "Trigonométriques",
      exponential: "Exponentielles",
      parametric: "Courbes Paramétriques",
      special: "Courbes Spéciales",
      polynomial: "Fonctions Polynomiales"
    },
    formulaPlotter: "Traceur de Formules",
    openFormulaTool: "Ouvrir le Traceur de Formules",
    closeFormulaTool: "Fermer le Traceur de Formules",
    tooltips: {
      plot: "Tracer formule",
      plotDescription: "Créer des graphiques mathématiques sur la grille"
    },
    scaleFactor: "Facteur d'Échelle",
    scaleFactorHint: "Ajustez pour rendre le graphique plus plat ou plus raide",
    scaleMin: "0.001x",
    scaleDefault: "1.0x",
    scaleMax: "10.0x",
    formulaPlaceholder: "x*x",
    formulaDefault: "f(x)",
    exampleCategory: "Catégorie",
    exampleName: "Nom",
    exampleDescription: "Description",
    colorPicker: "Choisir une couleur",
    deleteFormulaTooltip: "Supprimer cette formule",
    browseExamples: "Parcourir les exemples",
    pointX: "X",
    pointY: "Y",
    calculation: "Calcul",
    calculationError: "Erreur de calcul de la valeur",
    parametricPointInfo: "Fonction paramétrique (valeur t non disponible)",
    polarPointInfo: "Fonction polaire (valeur θ non disponible)",
    pointInfoTitle: "Information du Point",
    clickOnCurveInstruction: "Cliquez sur la courbe pour sélectionner un point et afficher ses informations.",
    naturalLanguageProcessing: "Traitement en cours...",
    naturalLanguageDescription: "Utilisez un langage naturel ou du pseudocode pour décrire la fonction que vous souhaitez créer. OpenAI la convertira en une expression mathématique.",
    configModal: {
      title: "Configuration",
      description: "Paramètres globaux de l'application",
      tabs: {
        general: "Général",
        display: "Affichage",
        openai: "OpenAI",
        developer: "Développeur"
      },
      general: {
        description: "Paramètres généraux de l'application",
        languageLabel: "Langue",
        languagePlaceholder: "Sélectionnez une langue"
      },
      display: {
        description: "Configurez l'apparence et le comportement de l'application.",
        toolbarVisibilityLabel: "Afficher la Barre d'Outils",
        toolbarVisibilityDescription: "Activez ou désactivez la visibilité de la barre d'outils. Lorsqu'elle est masquée, vous pouvez toujours utiliser les raccourcis clavier."
      },
      openai: {
        description: "Paramètres de l'API OpenAI",
        apiKeyLabel: "Clé API",
        apiKeyPlaceholder: "Entrez votre clé API OpenAI",
        apiKeyHint: "Votre clé API est stockée localement et chiffrée",
        clearApiKey: "Effacer la clé API"
      },
      developer: {
        description: "Options de développement",
        loggingLabel: "Niveau de journalisation",
        loggingDescription: "Définir le niveau de détail des journaux"
      },
      calibration: {
        title: "Calibration",
        description: "Calibrez l'écran pour des mesures précises",
        instructions: "Pour calibrer, mesurez une distance connue sur votre écran",
        lengthLabel: "Longueur de référence",
        startButton: "Commencer la calibration",
        placeRuler: "Placez une règle sur votre écran",
        lineDescription: "Ajustez la ligne pour qu'elle mesure exactement {length} {unit}",
        coarseAdjustment: "Ajustement grossier",
        fineAdjustment: "Ajustement fin",
        currentValue: "Valeur actuelle",
        pixelsPerUnit: "pixels/{unit}",
        cancelButton: "Annuler",
        applyButton: "Appliquer"
      }
    },
    gridZoom: 'Zoom du Gird',
    gridZoomHint: 'Ajuster le niveau de zoom du grid',
    zoomIn: 'Acercar',
    zoomOut: 'Alejar',
    zoomLevel: 'Niveau de Zoom',
    zoomReset: 'Resetear Zoom',
    showToolbar: "Afficher la Barre d'Outils",
    hideToolbar: "Masquer la Barre d'Outils",
    formula: {
      title: "Formule",
      untitled: "Sans titre",
      delete: "Supprimer",
      parameters: "Paramètres",
      options: "Options de formule",
      optionsTooltip: "Configurer les paramètres de la formule",
      description: "Configurer les paramètres et options de la formule",
      name: "Nom de la formule",
      minValue: "Valeur Minimale",
      maxValue: "Valeur Maximale",
      step: "Étape",
      parameterRange: "Plage de Paramètre",
      quickAdjust: "Régler Rapidement",
      parameterName: "Nom d'affichage",
      tabs: {
        general: "Général",
        parameters: "Paramètres"
      },
      parametersDescription: "Configurer les paramètres de la formule et leurs valeurs par défaut"
    },
  },
  de: {
    formulaEditor: "Formelplotter",
    formulaEditorDescription: "Erstellen und bearbeiten Sie mathematische Graphen",
    editor: "Editor",
    examples: "Beispiele",
    newFormula: "Neue Formel",
    formulaType: "Formeltyp",
    functionYofX: "Funktion y = f(x)",
    parametricXYofT: "Parametrisch x(t), y(t)",
    polarRofTheta: "Polar r = f(θ)",
    color: "Farbe",
    strokeWidth: "Linienbreite",
    samples: "Datenpunkte",
    functionExpression: "Funktion f(x) eingeben",
    parametricExpression: "Parametrische Gleichungen eingeben",
    polarExpression: "Polarausdruck eingeben",
    functionExpressionHint: "Verwenden Sie JavaScript-Syntax: x*x, Math.sin(x), usw.",
    parametricExpressionHint: "Format: x(t); y(t) - Verwenden Sie Semikolon zwischen Ausdrücken",
    polarExpressionHint: "Verwenden Sie 'theta' als Winkelvariable",
    xRange: "X-Bereich",
    tRange: "T-Bereich",
    thetaRange: "θ-Bereich",
    deleteFormula: "Löschen",
    use: "Verwenden",
    categories: {
      basic: "Grundfunktionen",
      trigonometric: "Trigonometrische",
      exponential: "Exponentielle",
      parametric: "Parametrische Kurven",
      special: "Spezielle Kurven",
      polynomial: "Polynomfunktionen"
    },
    formulaPlotter: "Formelplotter",
    openFormulaTool: "Formelplotter öffnen",
    closeFormulaTool: "Formelplotter schließen",
    tooltips: {
      plot: "Formel plotten",
      plotDescription: "Erstellen Sie mathematische Graphen auf dem Raster"
    },
    scaleFactor: "Skalierungsfaktor",
    scaleFactorHint: "Anpassen, um den Graphen flacher oder steiler zu machen",
    scaleMin: "0.001x",
    scaleDefault: "1.0x",
    scaleMax: "10.0x",
    formulaPlaceholder: "x*x",
    formulaDefault: "f(x)",
    exampleCategory: "Kategorie",
    exampleName: "Name",
    exampleDescription: "Beschreibung",
    colorPicker: "Farbe auswählen",
    deleteFormulaTooltip: "Diese Formel löschen",
    browseExamples: "Beispiele durchsuchen",
    pointX: "X",
    pointY: "Y",
    calculation: "Berechnung",
    calculationError: "Fehler bei der Berechnung des Wertes",
    parametricPointInfo: "Parametrische Funktion (t-Wert nicht verfügbar)",
    polarPointInfo: "Polarfunktion (θ-Wert nicht verfügbar)",
    pointInfoTitle: "Punktinformation",
    clickOnCurveInstruction: "Klicken Sie auf die Kurve, um einen Punkt auszuwählen und seine Informationen anzuzeigen.",
    gridZoom: 'Gitter-Zoom',
    gridZoomHint: 'Passen Sie die Zoomstufe des Gitters an',
    zoomIn: 'Vergrößern',
    zoomOut: 'Verkleinern',
    zoomLevel: 'Zoomstufe',
    zoomReset: 'Zoom zurücksetzen',
    showToolbar: "Werkzeugleiste anzeigen",
    hideToolbar: "Werkzeugleiste ausblenden",
    configModal: {
      title: "Konfiguration",
      description: "Anwendungseinstellungen konfigurieren",
      tabs: {
        general: "Allgemein",
        display: "Anzeige",
        openai: "OpenAI API",
        developer: "Entwickler"
      },
      general: {
        description: "Allgemeine Anwendungseinstellungen",
        languageLabel: "Sprache",
        languagePlaceholder: "Sprache auswählen"
      },
      display: {
        description: "Konfigurieren Sie das Aussehen und Verhalten der Anwendung.",
        toolbarVisibilityLabel: "Werkzeugleiste anzeigen",
        toolbarVisibilityDescription: "Schalten Sie die Sichtbarkeit der Werkzeugleiste um. Bei Ausblendung können Sie weiterhin Tastaturkürzel verwenden."
      },
      openai: {
        description: "OpenAI API-Einstellungen",
        apiKeyLabel: "API-Schlüssel",
        apiKeyPlaceholder: "Geben Sie Ihren OpenAI API-Schlüssel ein",
        apiKeyHint: "Ihr API-Schlüssel wird lokal gespeichert und verschlüsselt",
        clearApiKey: "API-Schlüssel löschen"
      },
      developer: {
        description: "Entwickleroptionen",
        loggingLabel: "Protokollierungsstufe",
        loggingDescription: "Detailgrad der Protokollierung festlegen"
      },
      calibration: {
        title: "Kalibrierung",
        description: "Kalibrieren Sie Ihren Bildschirm für genaue Messungen",
        instructions: "Zur Kalibrierung messen Sie eine bekannte Distanz auf Ihrem Bildschirm",
        lengthLabel: "Referenzlänge",
        startButton: "Kalibrierung starten",
        placeRuler: "Legen Sie ein Lineal auf Ihren Bildschirm",
        lineDescription: "Passen Sie die Linie an, um genau {length} {unit} zu messen",
        coarseAdjustment: "Grobe Anpassung",
        fineAdjustment: "Feine Anpassung",
        currentValue: "Aktueller Wert",
        pixelsPerUnit: "Pixel/{unit}",
        cancelButton: "Abbrechen",
        applyButton: "Anwenden"
      }
    },
    formula: {
      title: "Formel",
      untitled: "Unbenannt",
      delete: "Löschen",
      parameters: "Parameter",
      options: "Formeloptionen",
      optionsTooltip: "Formeleinstellungen konfigurieren",
      description: "Formeleinstellungen und Parameter konfigurieren",
      name: "Formelname",
      minValue: "Minimalwert",
      maxValue: "Maximalwert",
      step: "Schritt",
      parameterRange: "Parameterbereich",
      quickAdjust: "Schnell einstellen",
      parameterName: "Anzeigename",
      tabs: {
        general: "Allgemein",
        parameters: "Parameter"
      },
      parametersDescription: "Formelparameter und deren Standardwerte konfigurieren"
    },
  }
};
