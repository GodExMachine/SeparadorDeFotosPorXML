const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const archiver = require('archiver');



//comando para gera ro arquivo .exe -> pkg lerCprod.js --targets node16-win-x64

async function main() {
  try {
    const caminhos = fs.readFileSync('config.txt', 'utf-8');

    const linhaXml = caminhos.split('\n').find(l => l.startsWith('xml:'));
    const linhaFotos = caminhos.split('\n').find(l => l.startsWith('fotos:'));
    const linhaZip = caminhos.split('\n').find(l => l.startsWith('zips:'));

    if (!linhaXml || !linhaFotos || !linhaZip) {
      throw new Error('Caminhos não encontrados.');
    }

    const pastaXml = path.resolve(linhaXml.replace('xml:', '').trim());
    const pastaFotos = path.resolve(linhaFotos.replace('fotos:', '').trim());
    const pastaZip = path.resolve(linhaZip.replace('zips:', '').trim());

    if (!fs.existsSync(pastaZip)) {
      fs.mkdirSync(pastaZip, { recursive: true });
    }

    const arquivosXml = fs.readdirSync(pastaXml).filter(f => f.endsWith('.xml'));
    if (arquivosXml.length === 0) {
      console.log('Nenhum XML encontrado.');
      return;
    }

    const parser = new xml2js.Parser({ explicitArray: true });

    for (const arquivoXml of arquivosXml) {
      const caminhoXml = path.join(pastaXml, arquivoXml);
      console.log(`Processando: ${arquivoXml}`);

      const xmlData = fs.readFileSync(caminhoXml, 'utf-8');
      const result = await parser.parseStringPromise(xmlData);

      const infNFe = result.nfeProc?.NFe?.[0]?.infNFe?.[0] || result.NFe?.infNFe?.[0];
      if (!infNFe) {
        console.log(`Não foi possível localizar infNFe em ${arquivoXml}`);
        continue;
      }

      // Pegar <xNome> do destinatário
      const xNome = infNFe.dest?.[0]?.xNome?.[0].replace(/[\\/:*?"<>|]/g, '') || 'desconhecido';
      // Pegar <nNF> dentro de <ide>
      const nNF = infNFe.ide?.[0]?.nNF?.[0] || '0000';

      const nomeZip = `${nNF} ${xNome}.zip`;
      const caminhoZip = path.join(pastaZip, nomeZip);

      if (fs.existsSync(caminhoZip)) {
        console.log(`Já existe: ${nomeZip}`);
        continue;
      }

      // Buscar códigos cProd
      const codigos = new Set();
      function buscarCProd(obj) {
        if (typeof obj !== 'object') return;
        for (let chave in obj) {
          if (chave === 'cProd') {
            obj[chave].forEach(valor => codigos.add(valor));
          } else {
            buscarCProd(obj[chave]);
          }
        }
      }
      buscarCProd(infNFe);

      const listaCodigos = Array.from(codigos);

      // Selecionar fotos
      const arquivosFotos = listarArquivosRecursivo(pastaFotos);
      const fotosSelecionadas = arquivosFotos.filter(nomeArquivo => {
        const nomeSemExt = path.parse(nomeArquivo).name;
        return listaCodigos.includes(nomeSemExt);
      });

      if (fotosSelecionadas.length === 0) {
        console.log(`Nenhuma foto encontrada para ${arquivoXml}`);
        continue;
      }

      // Criar zip
      const output = fs.createWriteStream(caminhoZip);
      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(output);

      fotosSelecionadas.forEach(arquivo => {
        archive.file(arquivo, { name: path.basename(arquivo) });
      });

      await archive.finalize();
      console.log(`ZIP criado: ${nomeZip}`);
    }

function listarArquivosRecursivo(dir) {
  let resultados = [];

  const lista = fs.readdirSync(dir);
  lista.forEach(file => {
    const caminhoCompleto = path.join(dir, file);
    const stat = fs.statSync(caminhoCompleto);

    if (stat && stat.isDirectory()) {
      resultados = resultados.concat(listarArquivosRecursivo(caminhoCompleto));
    } else {
      resultados.push(caminhoCompleto);
    }
  });

  return resultados;
}



  } catch (erro) {
    console.error('Erro:', erro.message);
  }
}

main();