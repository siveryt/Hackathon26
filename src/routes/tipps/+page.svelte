<h1 class="p-4 text-2xl font-bold">Tipps</h1>
<!-- src/routes/tipps/+page.svelte -->
<script>
  import { page } from '$app/stores';
  import { slide } from 'svelte/transition';

  const tabs = [
    {
      id: 'bewegung',
      label: 'Bewegung',
      sections: [
        {
          title: 'Luftige, helle Kleidung tragen',
          content: 'Atmungsaktive Kleidung aus Naturfasern wie Leinen oder Baumwolle nimmt Schweiß auf und lässt die Luft zirkulieren. Helle Farben reflektieren Sonnenlicht besser als dunkle und verhindern zusätzliches Aufheizen. Auch ein Sonnenhut oder ein Tuch schützt unterwegs vor direkter Sonneneinstrahlung.'
        },
        {
          title: 'Belastungen in die kühleren Stunden verlegen',
          content: 'Körperlich anstrengende Tätigkeiten - ob Sport, Gartenarbeit oder Einkäufe - besser früh am Morgen oder am späten Abend erledigen. In der Mittagshitze zwischen 11 und 17 Uhr ist es sinnvoll, körperliche Belastungen weitestgehend zu vermeiden. In klimatisierten Innenräumen oder im Schatten können leichte Bewegungen wie Dehnen oder Spazierengehen guttun.'
        },
        {
          title: 'Hitze-taugliche Aktivitäten wählen',
          content: 'Sommerhitze bedeutet nicht, dass man gar nichts machen sollte - aber die Aktivitäten sollten gut gewählt sein. Kühle Orte wie Museen, Kinos oder Bibliotheken bieten Erholung und Abwechslung zur flirrenden Hitze draußen. Wer lieber draußen unterwegs ist, findet im Wald oder am Wasser meist angenehmere Temperaturen als in der Stadt. Aber auch gegen eine kleine Siesta in der Hängematte spricht natürlich nichts.'
        },
        {
          title: 'Schatten gezielt nutzen',
          content: 'Ob unterwegs oder auf dem Balkon: Schatten schützt den Körper vor Überhitzung. Besonders hilfreich sind große Sonnenhüte, Sonnenschirme, UV-schützende Kleidung oder leichte Tücher. In städtischen Gebieten bieten Parks oft eine willkommene Abkühlung.'
        }
      ]
    },
    {
      id: 'ernaehrung',
      label: 'Ernährung',
      sections: [
        {
          title: 'Viel trinken - und nicht zu kalt',
          content: 'An heißen Tagen steigt der Flüssigkeitsbedarf. Zwei bis drei Liter sind ein guter Richtwert - bei körperlicher Belastung entsprechend mehr. Ideal sind Wasser, Kräutertees oder verdünnte Fruchtschorlen. Wem Wasser zu langweilig ist, kann es auch mit erfrischendem Infused Water probieren. Eiskalte Getränke sollten jedoch lieber vermieden werden, da sie die Temperaturregulation im Körper durcheinanderbringen können.'
        },
        {
          title: 'Alkohol und viel Koffein besser meiden',
          content: 'Beide Stoffe entziehen dem Körper Flüssigkeit und können den Kreislauf zusätzlich belasten - gerade bei hohen Temperaturen. Ein kühles Bier oder ein Eiskaffee mögen verlockend sein, sind aber nicht ideal. Besser sind alkoholfreie Alternativen wie Infused Water (zum Beispiel mit Zitrone, Minze oder Beeren), Schorlen oder lauwarmer Kräutertee.'
        },
        {
          title: 'Leichte, wasserreiche Mahlzeiten bevorzugen',
          content: 'Der Körper muss bei der Verdauung Energie aufbringen - bei Hitze kann das schnell zu Trägheit oder Kreislaufproblemen führen. Empfehlenswert sind leichte Speisen wie Salate, kalte Gemüsesuppen, Joghurt mit frischen Früchten oder ein Vollkornbrot mit Hüttenkäse. Besonders hilfreich sind wasserreiche Lebensmittel wie Gurke, Melone, Tomate oder Zucchini. Auch selbstgemachtes Eis aus Wassermelone und Kokosmilch bietet eine gesunde Erfrischung.'
        },
        {
          title: 'Trinken Sie ausreichend!',
          content: 'Es ist allgemein bekannt, dass eine ausreichende Flüssigkeitszufuhr bei Hitze sehr wichtig ist. Dennoch vergessen viele Menschen, regelmäßig zu trinken. Da ein akutes Durstgefühl erst einsetzt, wenn der Körper bereits zu viel Wasser verloren hat, sollten Sie vorbeugend, auch ohne Durst, trinken. Es kann helfen, einen stündlichen Alarm einzurichten oder eine Wasserflasche immer in Griffweite zu haben. Da der Körper durch vermehrtes Schwitzen auch mehr Flüssigkeit verliert, muss die Trinkmenge bei Hitze entsprechend erhöht werden. Etwa zwei bis drei Liter Flüssigkeit pro Tag gelten für gesunde Erwachsene als ein guter Richtwert. Neben Wasser können Sie auch zu lauwarmem Tee oder Saftschorlen greifen. Den Konsum von Alkohol, Softdrinks oder koffeinhaltigen Getränken sollten Sie in Hitzeperioden hingegen möglichst gering halten.'
        }
      ]
    },
    {
      id: 'wohnen',
      label: 'Wohnen',
      sections: [
        {
          title: 'Früh abdunkeln',
          content: 'Wenn Sonnenstrahlen ungehindert durch Fenster scheinen, heizen sich Räume schnell auf. Rollläden, Jalousien oder Vorhänge am besten gleich morgens schließen - vor allem an Fenstern mit direkter Sonneneinstrahlung. Noch effektiver sind reflektierende Außenrollos oder Thermovorhänge.'
        },
        {
          title: 'Richtig lüften',
          content: 'Früh morgens und spät abends ist die Außenluft am kühlsten. Dann lohnt sich ein ausgiebiges Stoßlüften - idealerweise mit Durchzug, um die warme Luft aus der Wohnung zu verdrängen. Tagsüber sollten Fenster geschlossen bleiben, um die Hitze draußen zu halten.'
        },
        {
          title: 'Elektronische Geräte nur bei Bedarf nutzen',
          content: 'Viele Haushalts- und Elektrogeräte produzieren unbemerkt Wärme - Fernseher, Computer, Ladegeräte, Lampen. Diese besser nur dann einschalten, wenn sie wirklich gebraucht werden. Auch energiesparende LED-Leuchten tragen dazu bei, die Raumtemperatur nicht unnötig zu erhöhen.'
        },
        {
          title: 'Angenehme Schlafbedingungen schaffen',
          content: 'Hohe Nachttemperaturen rauben vielen den Schlaf. Leichte Bettwäsche aus Baumwolle oder Leinen staut keine Wärme und fördert damit die nächtliche Erholung deutlich. Auch ein lauwarmes Fußbad oder eine lauwarme Dusche vor dem Zubettgehen kann helfen, besser einzuschlafen. Ein weiterer Trick: Wadenwickel mit leicht kühlem Wasser (nicht eiskalt!) - sie helfen, die Körpertemperatur sanft zu senken. Im Schlafzimmer sollte vor dem Schlafen gut gelüftet oder ein Ventilator auf niedriger Stufe genutzt werden.'
        },
        {
          title: 'Auf sich achten - aber auch auf andere',
          content: 'Hitzewellen treffen nicht alle gleich: Kleine Kinder, ältere Menschen, Schwangere oder Menschen mit chronischen Erkrankungen leiden in der Regel stärker unter hohen Temperaturen und brauchen daher mehr Unterstützung. Überlegen Sie, wer in Ihrem Bekanntenkreis vielleicht Hilfe gebrauchen könnte.'
        },
        {
          title: 'Vergessen Sie den Sonnenschutz nicht!',
          content: 'An heißen Tagen scheint die Sonne meist besonders intensiv. Auch die UV-Strahlung ist stärker, weshalb ein effektiver Sonnenschutz umso entscheidender ist. Dabei geht es nicht nur darum, einem Sonnenbrand vorzubeugen, sondern sich auch vor Hautkrebs, einem Hitzschlag und sonnenbedingter Hautalterung zu schützen. Auch im Schatten sollte daher ein Sonnenschutzmittel mit hohem Lichtschutzfaktor verwendet werden – bei hellen Hauttypen und starker Sonne ist ein LSF von 50+ empfehlenswert. Tragen Sie Sonnencreme mindestens alle zwei Stunden großzügig auf und achten Sie beim Schwimmen, Baden oder starkem Schwitzen darauf, ein wasserfestes Produkt zu verwenden.'
        }
      ]
    },
    {
      id: 'aktivitaeten',
      label: 'Aktivitäten',
      sections: [
        {
          title: 'Wasserspaß - Schwimmen und Wassersportarten',
          content: 'Wer in der Nähe eines Meeres, eines Sees, eines Freibads oder eines Pools wohnt, kann dorthin zum Schwimmen und Planschen gehen. Auch für kühlende Wassersportarten sind große Gewässer ideal. Ob Wasserball, Tauchen lernen, Surfen oder Bootsfahrten – hier gibt es für jeden Geschmack etwas.'
        },
        {
          title: 'Garten und Balkon erfrischen',
          content: 'Zu Hause im Garten sorgen die Gartendusche oder der Rasensprenger für Abkühlung. Besonders Kinder lieben das Flitzen durchs kühle Nass. Auch ein kleines Planschbecken für Kinder ist gut für den Garten geeignet. Auf Balkon und Terrasse können Sie dieses ebenfalls aufstellen. Mit Wasser gefüllte Spritzpistolen oder Blumensprühflaschen können außerdem genutzt werden, um auch dem Körper ohne Anstrengung ein Gefühl von Urlaub und Meer zu geben.'
        },
        {
          title: 'Fußbäder und Barfußgehen',
          content: 'Wer nicht so am Planschen interessiert ist, aber trotzdem eine Abkühlung haben möchte, kann die Füße auch in eine Schüssel oder einen Eimer mit kaltem Wasser hängen. Besonders für ältere Menschen, die nicht mehr so aktiv sein wollen, ist das eine angenehme Wohltat. Auch ein Spaziergang durch kältere Gewässer kühlt den Körper bei warmem Wetter gut ab. Gleichzeitig ist das Barfußgehen erholsam und entspannend.'
        },
        {
          title: 'Sportspiele im Schatten',
          content: 'Im Schatten machen auch Tennis, Federball, Fußball und andere Sportspiele Spaß. Nutzen Sie für sportliche Aktivitäten jedoch eher die frühen Morgen- oder die späten Abendstunden. Achten Sie immer darauf, sich nicht der prallen Mittagssonne auszusetzen.'
        },
        {
          title: 'Drinnen und draußen - Spiele und kreative Aktivitäten',
          content: 'Lesen, Rätseln, Kartenspiele, Würfelspiele, Malen oder Basteln sind bei jedem Wetter gern ausgeführte Aktivitäten. Diese können Sie nicht nur draußen, sondern auch drinnen ausüben, wenn das Klima dort angenehmer ist. Indoor-Aktivitäten sind immer eine gute Idee, wenn das Wetter draußen ungemütlich ist. Mögliche Ideen sind Hörbücher, DIY-Projekte, Online-Kurse, ein Doku-Marathon oder das Selbermachen von Eis in der Küche.'
        },
        {
          title: 'Ausruhen an der frischen Luft',
          content: 'Ausruhen an der frischen Luft wirkt Wunder und erfrischt auch im Sommer. Ob Hängematte am Baum, Hollywoodschaukel im Garten oder Picknickdecke im Park – für jeden gibt es einen gemütlichen Platz.'
        },
        {
          title: 'Wanderungen und Waldaktivitäten',
          content: 'Bei heißem Wetter sind auch Spaziergänge, Wanderungen (selbst für Einsteiger und Einsteigerinnen) oder Fahrradtouren durch kühle Wälder und Gebirge erholsam. Suchen Sie sich schattige Wege aus und achten Sie auf leichte Kleidung, damit Sie nicht so leicht ins Schwitzen kommen. Beim Waldbaden lassen Sie sich bewusst langsam und ohne Ziel durch den Wald treiben. So nehmen Sie die Natur intensiv wahr, reduzieren Ihren Stress und verbessern Ihr Wohlbefinden.'
        },
        {
          title: 'Bildungsangebote und kulturelle Einrichtungen',
          content: 'Wenn Sie etwas für Ihre Bildung tun möchten, können Sie auch den Besuch einer Höhle oder eines alten Gemäuers einplanen. Häufig klimatisiert sind zudem Museen und andere öffentliche Einrichtungen, die sich auch bei hohen Temperaturen über Besucher freuen. Hier gibt es Themen für Klein und Groß, Jung und Alt. Suchen Sie sich die richtige Einrichtung aus, besorgen Sie am besten vorab Karten, um langes Anstehen zu vermeiden, und verbringen Sie einen schönen Tag.'
        }
      ]
    }
  ];

  let activeTab = $derived($page.url.searchParams.get('tab') || 'bewegung');
  let currentTab = $derived(tabs.find(t => t.id === activeTab));
  
  // Track which sections are expanded per tab - mit $state für Reaktivität
  let expandedSections = $state({});

  function toggleSection(tabId, sectionIndex) {
    const key = `${tabId}-${sectionIndex}`;
    expandedSections[key] = !expandedSections[key];
  }
</script>

<div class="container">
  <h1>Tipps für heiße Tage</h1>

  <div class="tabs">
    <div class="tab-buttons">
      {#each tabs as tab}
        <a 
          href="?tab={tab.id}"
          class:active={activeTab === tab.id}
        >
          {tab.label}
        </a>
      {/each}
    </div>

    <div class="tab-content">
      {#if currentTab}
        <div class="accordion">
          {#each currentTab.sections as section, index (index)}
            {@const isExpanded = expandedSections[`${activeTab}-${index}`]}
            <div class="accordion-item">
              <button
                class="accordion-button"
                class:expanded={isExpanded}
                onclick={() => toggleSection(activeTab, index)}
              >
                <span class="accordion-title">{section.title}</span>
                <span class="accordion-icon">
                  {#if isExpanded}
                    ▼
                  {:else}
                    ▶
                  {/if}
                </span>
              </button>
              
              {#if isExpanded}
                <div class="accordion-content" transition:slide>
                  <p>{section.content}</p>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }

  h1 {
    color: #333;
    margin-bottom: 30px;
    text-align: center;
  }

  .tabs {
    width: 100%;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .tab-buttons {
    display: flex;
    border-bottom: 2px solid #e0e0e0;
    gap: 0;
    background-color: #f9f9f9;
    flex-wrap: wrap;
  }

  .tab-buttons a {
    flex: 1;
    min-width: 120px;
    padding: 16px 20px;
    text-decoration: none;
    color: #666;
    cursor: pointer;
    border-bottom: 3px solid transparent;
    transition: all 0.3s ease;
    font-weight: 500;
    text-align: center;
    background-color: #f9f9f9;
  }

  .tab-buttons a:hover {
    background-color: #f0f0f0;
    color: #333;
  }

  .tab-buttons a.active {
    color: #ff6b35;
    border-bottom-color: #ff6b35;
    background-color: #ffffff;
  }

  .tab-content {
    padding: 20px;
    min-height: 300px;
    animation: fadeIn 0.3s ease;
  }

  .accordion {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .accordion-item {
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    overflow: hidden;
    background-color: #ffffff;
  }

  .accordion-button {
    width: 100%;
    padding: 16px 20px;
    border: none;
    background-color: #f9f9f9;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s ease;
    font-size: 16px;
    font-weight: 500;
    color: #333;
  }

  .accordion-button:hover {
    background-color: #f0f0f0;
  }

  .accordion-button.expanded {
    background-color: #fff3f0;
    color: #ff6b35;
  }

  .accordion-title {
    text-align: left;
    flex: 1;
  }

  .accordion-icon {
    margin-left: 10px;
    font-size: 12px;
    transition: transform 0.3s ease;
    color: #ff6b35;
  }

  .accordion-content {
    padding: 0 20px 16px 20px;
    background-color: #ffffff;
    border-top: 1px solid #e0e0e0;
  }

  .accordion-content p {
    color: #555;
    line-height: 1.6;
    margin: 16px 0 0 0;
    text-align: justify;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 600px) {
    .tab-buttons a {
      flex: 1 1 auto;
      min-width: 90px;
      padding: 12px 10px;
      font-size: 13px;
    }

    .tab-content {
      padding: 15px;
    }

    .accordion-button {
      padding: 12px 15px;
      font-size: 14px;
    }

    .accordion-content {
      padding: 0 15px 12px 15px;
    }

    .accordion-content p {
      margin: 12px 0 0 0;
      text-align: left;
    }
  }
</style>
