const fs=require("fs"),path=require("path");
// Junta o index.html e seus <script src> em um único HTML (o jsdom dos testes não carrega arquivos externos).
module.exports=dir=>{let h=fs.readFileSync(path.join(dir,"index.html"),"utf8");
  return h.replace(/<script src="([^"]+)"><\/script>/g,(_,f)=>"<script>"+fs.readFileSync(path.join(dir,f),"utf8").replace(/<\/script>/g,"<\\/script>")+"</script>")};
