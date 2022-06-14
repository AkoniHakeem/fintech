import forge from 'node-forge'
export default class Ecrypt {
  public static async encrypt(payload: unknown, key: string): Promise<string> {
    var cipher = forge.cipher.createCipher('3DES-ECB', forge.util.createBuffer(key))
    cipher.start({ iv: '' })
    cipher.update(forge.util.createBuffer(JSON.stringify(payload), 'utf8'))
    cipher.finish()
    var encrypted = cipher.output
    return forge.util.encode64(encrypted.getBytes())
  }
}
