#!/usr/bin/env python3
"""Restaura acentos nas falas dos Pokémon (arquivos falas_pokemon_*.txt).
Uso: python3 tools/corrigir_acentos.py <pasta_de_entrada> <pasta_de_saida>
Só mexe no texto entre aspas e no campo de tipos. Nomes e gritos ficam intactos.
Gera RELATORIO_ACENTOS.txt com o que mudou e com os casos de "e/é" para revisão."""
import re,sys,glob,os,collections

MAPA={
"delicia":"delícia","voce":"você","voces":"vocês","adversario":"adversário","adversarios":"adversários","rapido":"rápido","rapida":"rápida","rapidos":"rápidos","rapidas":"rápidas",
"agua":"água","aguas":"águas","forca":"força","sao":"são","estao":"estão","ceu":"céu","ninguem":"ninguém","alguem":"alguém","dragao":"dragão","nao":"não","ate":"até",
"eletrico":"elétrico","eletrica":"elétrica","eletricos":"elétricos","espirito":"espírito","tres":"três","guardiao":"guardião","arvore":"árvore","arvores":"árvores",
"la":"lá","ja":"já","so":"só","ha":"há","pes":"pés","mae":"mãe","sabio":"sábio","magica":"mágica","magico":"mágico","psiquico":"psíquico","agil":"ágil","unico":"único",
"musica":"música","historia":"história","historias":"histórias","memoria":"memória","familia":"família","tambem":"também","alem":"além","leao":"leão","tubarao":"tubarão",
"coracao":"coração","maos":"mãos","aco":"aço","pinca":"pinça","pincas":"pinças","ferrao":"ferrão","dificil":"difícil","facil":"fácil","confiavel":"confiável","confortavel":"confortável",
"incrivel":"incrível","possivel":"possível","invisivel":"invisível","terrivel":"terrível","veu":"véu","chapeu":"chapéu","paraiso":"paraíso","atras":"atrás","apos":"após","lamina":"lâmina",
"cabeca":"cabeça","cabecas":"cabeças","faco":"faço","danca":"dança","dancar":"dançar","apareco":"apareço","desapareco":"desapareço","abraco":"abraço","abracos":"abraços","abracar":"abraçar",
"alcanca":"alcança","lanca":"lança","peca":"peça","fumaca":"fumaça","esquenta":"esquenta","paciencia":"paciência","inteligencia":"inteligência","experiencia":"experiência",
"proxima":"próxima","proximo":"próximo","ultimo":"último","ultima":"última","otimo":"ótimo","tecnica":"técnica","heroi":"herói","lider":"líder","gelida":"gélida","serio":"sério",
"esta":"está","estaria":"estaria","imagem":"imagem","fantasticos":"fantásticos","vulcao":"vulcão","emocao":"emoção","emocoes":"emoções","ilusao":"ilusão","multidao":"multidão",
"irmao":"irmão","irmaos":"irmãos","cidadao":"cidadão","coracoes":"corações","paises":"países","area":"área","areas":"áreas","tropico":"trópico","caracter":"caráter",
"serpente":"serpente","periodo":"período","voo":"voo","ateh":"até","cafe":"café","bebe":"bebê","jacare":"jacaré","sofa":"sofá","cha":"chá","po":"pó","ima":"ímã","trovao":"trovão","algodao":"algodão","chao":"chão","elegancia":"elegância","mimica":"mímica","explosao":"explosão","pao":"pão","reuniao":"reunião","estacoes":"estações","furacao":"furacão","determinacao":"determinação","mecanico":"mecânico","canhoes":"canhões","cancao":"canção","escuridao":"escuridão","vulcoes":"vulcões","imas":"ímãs",
"vitoria":"vitória","gloria":"glória","mistica":"mística","mistico":"místico","tipico":"típico","pratico":"prático","romantico":"romântico","simpatico":"simpático","eletronico":"eletrônico",
}
TIPOS={"Agua":"Água","Eletrico":"Elétrico","Psiquico":"Psíquico","Dragao":"Dragão","Aco":"Aço"}
ADJ=set("""forte fortes rapido rapida grande grandes pequeno pequena pequenino pequenina fofinho fofinha fofa esperto esperta corajoso corajosa elegante curioso curiosa cheio cheia
enorme quentinha lindo linda bonito bonita misterioso misteriosa eletrico eletrica suave macio macia leve silencioso resistente afiadas afiados inteligente tranquilo tranquila feliz
gelado gelada alegre bravo leal simpatico travesso timido peludo peluda calmo firme confiavel veloz alto baixo verde doce cheiroso gordinho comprido antigo raro rara especial sabio
protetor protetora forte brilhante gostoso gostosa tonto bobo gentil sombrio escuro claro cansado cansada confortavel""".split())
ADV={"muito","mais","bem","tao","super"}
VERBOS=set("""sou estou tenho vou fico sinto moro vivo gosto adoro trago levo cuido protejo guardo luto voo nado corro danco canto uso faco enxergo ouco ataco cavo flutuo escondo penso cresco
giro solto venco vejo durmo apareco desapareco vibro dou mudo aqueco carrego pulo brinco amo quero posso sei digo vamos somos ficamos trabalhamos""".split())

def casar(orig,novo):
    if orig.isupper() and len(orig)>1: return novo.upper()
    if orig[0].isupper(): return novo[0].upper()+novo[1:]
    return novo

PONTUAIS={"Spinarak! Eu tecer teias e feliz!":"Spinarak! Eu adoro tecer teias e fico feliz!","Leavanny! Eu tecer lindas folhas!":"Leavanny! Eu tenho prazer em tecer lindas folhas!","Tarountula! Eu tecer teias com cuidado!":"Tarountula! Eu tenho cuidado ao tecer minhas teias!"}
def corrigir_fala(txt,rel,linha):
    if txt in PONTUAIS: rel["trocas"]["(frase corrigida)"]+=1; return PONTUAIS[txt],1
    if re.match(r"^[A-Za-zÀ-ÿ-]+! Que delicia!$",txt):   # grito + "Que delícia!"
        return txt.replace("delicia","delícia"),1
    # tokeniza preservando separadores; palavras ligadas por hífen ficam intactas (gritos)
    partes=re.split(r"([A-Za-zÀ-ÿ]+(?:-[A-Za-zÀ-ÿ]+)*)",txt)
    toks=[(i,p) for i,p in enumerate(partes) if i%2==1]
    mudou=0;out=list(partes)
    seq=[p.lower() for _,p in toks]
    # limites de oração: posição do último sinal de pontuação forte antes de cada palavra
    inicio=0
    for k,(i,p) in enumerate(toks):
        sep=partes[i-1] if i>0 else ""
        if re.search(r"[!.?:;,]",sep): inicio=k
        w=p.lower()
        if "-" in w: continue
        if w=="e":
            prev=seq[k-1] if k>0 else "";nxt=seq[k+1] if k+1<len(seq) else ""
            oracao=seq[inicio:k]
            verbo_antes=any(t in VERBOS for t in oracao)
            if prev and prev not in ADJ and not verbo_antes and (nxt in ADJ or nxt in ADV) and not prev.endswith(("ar","er","ir")):
                out[i]=casar(p,"é");mudou+=1;rel["e_para_é"].append(f"{linha}: ...{' '.join(seq[max(0,k-3):k+3])}...")
            elif nxt in ADJ and prev not in ADJ and not verbo_antes:
                rel["e_revisar"].append(f"{linha}: ...{' '.join(seq[max(0,k-3):k+3])}...")
            continue
        if w=="la" and k>0 and seq[k-1] in ("meu","seu","o","de","minha","do"):
            out[i]=casar(p,"lã");mudou+=1;rel["trocas"]["la→lã"]+=1;continue
        if w in MAPA and MAPA[w]!=w:
            out[i]=casar(p,MAPA[w]);mudou+=1;rel["trocas"][w+"→"+MAPA[w]]+=1
    return "".join(out),mudou

def main(ent,sai):
    os.makedirs(sai,exist_ok=True)
    rel={"trocas":collections.Counter(),"e_para_é":[],"e_revisar":[]};total=0
    for arq in sorted(glob.glob(os.path.join(ent,"falas_pokemon_*.txt"))):
        linhas=open(arq,encoding="utf-8").read().split("\n");novas=[]
        for n,l in enumerate(linhas,1):
            m=re.match(r'^(\s+\[\w+\] ")(.*)("\s*)$',l)
            if m:
                t,c=corrigir_fala(m.group(2),rel,f"{os.path.basename(arq)}:{n}");total+=c;novas.append(m.group(1)+t+m.group(3));continue
            m=re.match(r'^(\d+ .+? \| )(.+?)( \| grito: .*)$',l)
            if m:
                tipos="/".join(TIPOS.get(x,x) for x in m.group(2).split("/"));novas.append(m.group(1)+tipos+m.group(3));continue
            novas.append(l)
        open(os.path.join(sai,os.path.basename(arq)),"w",encoding="utf-8").write("\n".join(novas))
    with open(os.path.join(sai,"RELATORIO_ACENTOS.txt"),"w",encoding="utf-8") as r:
        r.write(f"Trocas feitas: {total}\n\n== Palavras corrigidas ==\n")
        for k,v in rel["trocas"].most_common():r.write(f"{v:5} {k}\n")
        r.write(f"\n== 'e' virou 'é' ({len(rel['e_para_é'])}) ==\n"+"\n".join(rel["e_para_é"]))
        r.write(f"\n\n== 'e' mantido, mas vale revisar ({len(rel['e_revisar'])}) ==\n"+"\n".join(rel["e_revisar"])+"\n")
    print("trocas:",total,"| e→é:",len(rel["e_para_é"]),"| revisar:",len(rel["e_revisar"]))
if __name__=="__main__":main(sys.argv[1],sys.argv[2])
