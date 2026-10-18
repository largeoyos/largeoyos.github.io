"""Check transform math, tiny/odd image sizes, and decoding in a new process."""
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

from dct_demo import BLOCK, dct_matrix, decode, encode, from_blocks, to_blocks


class DCTChecks(unittest.TestCase):
    def test_orthonormal_and_lossless_transform_before_quantization(self):
        c = dct_matrix()
        np.testing.assert_allclose(c @ c.T, np.eye(BLOCK), atol=1e-14)
        block = np.random.default_rng(7).normal(size=(8, 8))
        coefficients = c @ block @ c.T
        np.testing.assert_allclose(c.T @ coefficients @ c, block, atol=1e-13)

    def test_known_constant_block(self):
        c = dct_matrix()
        coefficients = c @ np.full((8, 8), 10.0) @ c.T
        self.assertAlmostEqual(coefficients[0, 0], 80.0)
        coefficients[0, 0] = 0
        np.testing.assert_allclose(coefficients, 0, atol=1e-13)

    def test_block_layout_does_not_mix_pixels(self):
        image = np.arange(16 * 24).reshape(16, 24)
        np.testing.assert_array_equal(to_blocks(image)[1, 2], image[8:16, 16:24])
        np.testing.assert_array_equal(from_blocks(to_blocks(image)), image)

    def test_padding_and_constant_image(self):
        with tempfile.TemporaryDirectory() as folder:
            for shape in [(1, 1), (7, 11), (16, 24)]:
                image = np.full(shape, 128, dtype=np.uint8)
                path = Path(folder) / "image.dct"
                encode(image, 2, path)
                np.testing.assert_array_equal(decode(path), image)

    def test_decode_needs_no_original_in_a_separate_process(self):
        with tempfile.TemporaryDirectory() as folder:
            image = np.random.default_rng(23).integers(0, 256, (37, 53), dtype=np.uint8)
            path = Path(folder) / "image.dct"
            output = Path(folder) / "decoded.png"
            encode(image, 1, path)
            subprocess.run([sys.executable, str(Path(__file__).with_name("dct_demo.py")),
                            "decode", str(path), "--output", str(output)], check=True,
                           capture_output=True, text=True)
            with Image.open(output) as decoded:
                self.assertEqual(decoded.size, (53, 37))
                np.testing.assert_array_equal(np.asarray(decoded), decode(path))


if __name__ == "__main__":
    unittest.main()
